import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { device_id } = await req.json();

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'Missing device_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const privateKey = Deno.env.get('RSA_PRIVATE_KEY')!;

    // Check for existing trial on this device
    const { data: existingTrial, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    if (!existingTrial) {
      return new Response(JSON.stringify({ 
        has_trial: false,
        message: 'No active trial found for this device'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Check if trial has expired
    const expiresAt = new Date(existingTrial.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      return new Response(JSON.stringify({ 
        has_trial: false,
        expired: true,
        message: 'Trial has expired'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Calculate remaining days
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

    // Generate new JWT for the existing trial
    const key = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = {
      license_key: existingTrial.license_key,
      device_id: existingTrial.device_hash,
      is_trial: existingTrial.is_trial,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const jwt = await create({ alg: 'RS256', typ: 'JWT' }, payload, key);

    return new Response(JSON.stringify({ 
      has_trial: true,
      remaining_days: remainingDays,
      jwt_token: jwt,
      message: `Trial has ${remainingDays} days remaining`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});