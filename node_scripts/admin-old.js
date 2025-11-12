/**
 * PARAMETRIX License Admin Tool
 * Generates and manages license keys in Supabase
 * 
 * Usage:
 * node admin.js generate "John Doe" --trial
 * node admin.js generate "Jane Smith" --full
 * node admin.js revoke PRM-1234-5678
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
globalThis.fetch = fetch;

// Configuration - Supabase credentials
const SUPABASE_URL = 'https://hbslewdkkgwsaohjyzak.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhic2xld2Rra2d3c2FvaGp5emFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzM5NDE2MSwiZXhwIjoyMDU4OTcwMTYxfQ.xbpxYHH5UCdszrAQc39GBgkwBNjzCzOo79M1vonSoyM';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generate a license key in PRM-XXXX-XXXX format
 * @returns {string} Generated license key
 */
function generateLicenseKey() {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PRM-${part1}-${part2}`;
}

/**
 * Create a new license in the database
 * @param {string} userName - Name of the license holder
 * @param {boolean} isTrial - Whether this is a trial license
 * @returns {Promise<Object>} License creation result
 */
async function createLicense(userName, isTrial = false) {
    try {
        const licenseKey = generateLicenseKey();
        const deviceHash = ''; // Will be set when user activates
        
        const expiresAt = isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
        
        const { data, error } = await supabase
            .from('licenses')
            .insert([
                {
                    license_key: licenseKey,
                    user_name: userName,
                    device_hash: deviceHash,
                    expires_at: expiresAt,
                    is_trial: isTrial,
                    status: 'active'
                }
            ])
            .select();

        if (error) throw error;

        console.log('✅ License created successfully!');
        console.log(`License Key: ${licenseKey}`);
        console.log(`User: ${userName}`);
        console.log(`Type: ${isTrial ? 'Trial (7 days)' : 'Full License'}`);
        console.log(`Status: Active`);
        
        return data[0];
    } catch (error) {
        console.error('❌ Error creating license:', error.message);
        throw error;
    }
}

/**
 * Revoke a license by setting its status to 'revoked'
 * @param {string} licenseKey - The license key to revoke
 * @returns {Promise<void>}
 */
async function revokeLicense(licenseKey) {
    try {
        const { data, error } = await supabase
            .from('licenses')
            .update({ status: 'revoked' })
            .eq('license_key', licenseKey)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            console.log('❌ License key not found');
            return;
        }

        console.log('✅ License revoked successfully!');
        console.log(`License Key: ${licenseKey}`);
        console.log(`User: ${data[0].user_name}`);
        console.log(`Status: Revoked`);
    } catch (error) {
        console.error('❌ Error revoking license:', error.message);
        throw error;
    }
}

/**
 * List all licenses in the database
 * @returns {Promise<void>}
 */
async function listLicenses() {
    try {
        const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .order('issued_at', { ascending: false });

        if (error) throw error;

        console.log('\n📋 All Licenses:');
        console.log('================');
        
        data.forEach(license => {
            const type = license.is_trial ? 'Trial' : 'Full';
            const expires = license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never';
            console.log(`${license.license_key} | ${license.user_name} | ${type} | ${license.status} | Expires: ${expires}`);
        });
    } catch (error) {
        console.error('❌ Error listing licenses:', error.message);
        throw error;
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('PARAMETRIX License Admin Tool');
        console.log('Usage:');
        console.log('  node admin.js generate "User Name" --trial');
        console.log('  node admin.js generate "User Name" --full');
        console.log('  node admin.js revoke PRM-1234-5678');
        console.log('  node admin.js list');
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'generate':
                if (args.length < 2) {
                    console.log('❌ Please provide a user name');
                    return;
                }
                const userName = args[1];
                const isTrial = args.includes('--trial');
                await createLicense(userName, isTrial);
                break;

            case 'revoke':
                if (args.length < 2) {
                    console.log('❌ Please provide a license key');
                    return;
                }
                const licenseKey = args[1];
                await revokeLicense(licenseKey);
                break;

            case 'list':
                await listLicenses();
                break;

            default:
                console.log('❌ Unknown command:', command);
                break;
        }
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
}
