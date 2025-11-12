const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // for sending emails via Resend
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = 'support@mimevents.com';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY; // PEM format

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendTrialEmail(userName, userEmail) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `PARAMETRIX <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: 'Welcome to your PARAMETRIX 7-Day Trial!',
        html: `
          <h1>Welcome, ${userName}!</h1>
          <p>Your 7-day trial for the PARAMETRIX SketchUp extension has been successfully activated.</p>
          <p>Your trial is associated with this email address and locked to your device.</p>
          <p>Enjoy using the extension!</p>
          <p>The PARAMETRIX Team</p>
        `,
      }),
    });
    if (!response.ok) {
      console.error('Resend API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send trial email:', error);
  }
}

app.post('/check-trial', async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' });
    }

    const { data: existingTrial, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!existingTrial) {
      return res.json({ has_trial: false, message: 'No active trial found' });
    }

    const expiresAt = new Date(existingTrial.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      return res.json({ has_trial: false, expired: true, message: 'Trial expired' });
    }

    const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    const token = jwt.sign(
      {
        license_key: existingTrial.license_key,
        device_id: existingTrial.device_hash,
        is_trial: existingTrial.is_trial,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      RSA_PRIVATE_KEY,
      { algorithm: 'RS256' }
    );

    return res.json({ 
      has_trial: true,
      remaining_days: remainingDays,
      jwt_token: token,
      message: `Trial has ${remainingDays} days remaining`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/create-trial', async (req, res) => {
  try {
    const { name, email, device_id } = req.body;
    if (!name || !email || !device_id) {
      return res.status(400).json({ error: 'Missing name, email, or device_id' });
    }

    // Check if device already has a trial
    const { data: existingTrial, error: queryError } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true)
      .eq('status', 'active')
      .single();

    if (queryError && queryError.code !== 'PGRST116') throw queryError;

    if (existingTrial) {
      const expiresAt = new Date(existingTrial.expires_at);
      const now = new Date();
      
      if (expiresAt > now) {
        const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        const token = jwt.sign(
          {
            license_key: existingTrial.license_key,
            device_id: existingTrial.device_hash,
            is_trial: existingTrial.is_trial,
            exp: Math.floor(expiresAt.getTime() / 1000),
          },
          RSA_PRIVATE_KEY,
          { algorithm: 'RS256' }
        );
        return res.json({ 
          jwt_token: token,
          message: `Trial has ${remainingDays} days remaining`,
          remaining_days: remainingDays
        });
      } else {
        return res.status(409).json({ 
          error: 'Trial has expired. Please purchase a full license to continue.',
          existing_license: existingTrial.license_key
        });
      }
    }

    const licenseKey = `PRM-TRIAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: newLicense, error: insertError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        user_name: name,
        email: email,
        device_hash: device_id,
        expires_at: expiresAt.toISOString(),
        is_trial: true,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Send welcome email async
    sendTrialEmail(name, email);

    // Generate JWT signed with your PEM private key
    const token = jwt.sign(
      {
        license_key: newLicense.license_key,
        device_id: newLicense.device_hash,
        is_trial: newLicense.is_trial,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      RSA_PRIVATE_KEY,
      { algorithm: 'RS256' }
    );

    return res.json({ jwt_token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => console.log('License server running on http://localhost:3000'));
