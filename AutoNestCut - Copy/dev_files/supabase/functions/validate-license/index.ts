import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { license_key, device_id } = await req.json()
    
    if (!license_key || !device_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing license_key or device_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const privateKeyPem = Deno.env.get('RSA_PRIVATE_KEY')!

    if (!privateKeyPem) {
      throw new Error("RSA_PRIVATE_KEY is not set in environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query license
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single()

    if (error || !license) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if revoked
    if (license.revoked) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License has been revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check device binding
    if (license.device_id && license.device_id !== device_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License is bound to a different device' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bind device if not already bound
    if (!license.device_id) {
      await supabase
        .from('licenses')
        .update({ device_id, last_validated: new Date().toISOString() })
        .eq('license_key', license_key)
    } else {
      // Update last validation
      await supabase
        .from('licenses')
        .update({ last_validated: new Date().toISOString() })
        .eq('license_key', license_key)
    }

    // --- Correctly Import RSA Private Key ---
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKeyPem.substring(pemHeader.length, privateKeyPem.length - pemFooter.length).replace(/\s/g, '');
    const binaryDer = atob(pemContents);

    const binaryDerArr = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
        binaryDerArr[i] = binaryDer.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryDerArr.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    )
    // --- End Key Import ---

    const payload = {
      license_key,
      device_id,
      license_type: license.license_type,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, key)

    return new Response(
      JSON.stringify({ 
        valid: true, 
        jwt_token: jwt,
        license_type: license.license_type,
        expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("--- Function crashed ---");
    console.error(error.message);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})