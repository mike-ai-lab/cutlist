/**
 * PARAMETRIX License Validation Edge Function
 * Validates license keys and generates JWT tokens
 * 
 * Deploy this to Supabase Edge Functions:
 * supabase functions deploy validate-license --project-ref YOUR_PROJECT_REF
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

// Configuration - These will be set as environment variables in Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '<SUPABASE_URL>';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '<SUPABASE_SERVICE_KEY>';

// RSA Private Key for JWT signing - Set this in Supabase environment variables
const RSA_PRIVATE_KEY = Deno.env.get('RSA_PRIVATE_KEY') || '<RSA_PRIVATE_KEY>';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Import RSA private key for JWT signing
 * @returns {Promise<CryptoKey>} The imported private key
 */
async function importPrivateKey() {
    try {
        // Remove header/footer and whitespace from PEM key
        const pemKey = RSA_PRIVATE_KEY
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');
        
        // Convert base64 to binary
        const binaryKey = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
        
        // Import the key
        return await crypto.subtle.importKey(
            'pkcs8',
            binaryKey,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256',
            },
            false,
            ['sign']
        );
    } catch (error) {
        console.error('Error importing private key:', error);
        throw new Error('Failed to import RSA private key');
    }
}

/**
 * Validate license key and device hash against database
 * @param {string} licenseKey - The license key to validate
 * @param {string} deviceHash - The device hash to bind to
 * @returns {Promise<Object>} Validation result
 */
async function validateLicense(licenseKey, deviceHash) {
    try {
        // Query the license from database
        const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .eq('license_key', licenseKey)
            .eq('status', 'active')
            .single();

        if (error || !data) {
            return {
                valid: false,
                message: 'Invalid or inactive license key',
                license: null
            };
        }

        // Check if license has expired (for trial licenses)
        if (data.expires_at) {
            const expirationDate = new Date(data.expires_at);
            const now = new Date();
            
            if (now > expirationDate) {
                return {
                    valid: false,
                    message: 'License has expired',
                    license: data
                };
            }
        }

        // Check device binding
        if (data.device_hash && data.device_hash !== deviceHash) {
            return {
                valid: false,
                message: 'License is bound to a different device',
                license: data
            };
        }

        // If device_hash is empty, bind it to this device
        if (!data.device_hash) {
            const { error: updateError } = await supabase
                .from('licenses')
                .update({ device_hash: deviceHash })
                .eq('id', data.id);

            if (updateError) {
                console.error('Error binding device:', updateError);
                return {
                    valid: false,
                    message: 'Failed to bind license to device',
                    license: data
                };
            }

            // Update the data object with the new device hash
            data.device_hash = deviceHash;
        }

        return {
            valid: true,
            message: 'License validated successfully',
            license: data
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            valid: false,
            message: 'Database validation failed',
            license: null
        };
    }
}

/**
 * Generate JWT token with license information
 * @param {Object} license - The license data
 * @param {CryptoKey} privateKey - The RSA private key
 * @returns {Promise<string>} The JWT token
 */
async function generateJWT(license, privateKey) {
    try {
        const payload = {
            iss: 'parametrix-license-server',
            sub: license.user_name,
            license_key: license.license_key,
            device_hash: license.device_hash,
            is_trial: license.is_trial,
            expires_at: license.expires_at,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days validity
        };

        const jwt = await create(
            { alg: "RS256", typ: "JWT" },
            payload,
            privateKey
        );

        return jwt;
    } catch (error) {
        console.error('JWT generation error:', error);
        throw new Error('Failed to generate JWT token');
    }
}

/**
 * Main request handler
 */
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ valid: false, message: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }

    try {
        // Parse request body
        const { license_key, device_hash } = await req.json();

        // Validate input parameters
        if (!license_key || !device_hash) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'Missing license_key or device_hash'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        // Validate license against database
        const validation = await validateLicense(license_key, device_hash);

        if (!validation.valid) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    message: validation.message
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        // Generate JWT token
        const privateKey = await importPrivateKey();
        const token = await generateJWT(validation.license, privateKey);

        // Return success response with JWT
        return new Response(
            JSON.stringify({
                valid: true,
                message: 'License validated successfully',
                token: token,
                is_trial: validation.license.is_trial,
                expires_at: validation.license.expires_at
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

    } catch (error) {
        console.error('Request processing error:', error);
        
        return new Response(
            JSON.stringify({
                valid: false,
                message: 'Internal server error'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
});