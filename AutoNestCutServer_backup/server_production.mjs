// server_production.mjs - Production License Server
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const CONFIG = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SENDER_EMAIL: process.env.SENDER_EMAIL || 'support@mimevents.com',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RSA_PRIVATE_KEY: fs.readFileSync(path.join(process.cwd(), 'private_key.pem'), 'utf8'),
  RSA_PUBLIC_KEY: fs.readFileSync(path.join(process.cwd(), 'public_key.pem'), 'utf8'),
  TRIAL_DURATION_DAYS: parseInt(process.env.TRIAL_DURATION_DAYS) || 7,
  EXTENSION_NAME: process.env.EXTENSION_NAME || 'PARAMETRIX',
  JWT_ISSUER: process.env.JWT_ISSUER || 'parametrix-license-server',
  PORT: process.env.PORT || 3000
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY);

// Enhanced JWT creation with all required fields
function createJWT(license, extensionName = CONFIG.EXTENSION_NAME) {
  const payload = {
    iss: CONFIG.JWT_ISSUER,
    sub: license.license_key,
    license_key: license.license_key,
    device_id: license.device_hash,
    extension_name: extensionName,
    is_trial: license.is_trial,
    user_email: license.email,
    status: license.status,
    iat: Math.floor(Date.now() / 1000),
    exp: license.expires_at ? Math.floor(new Date(license.expires_at).getTime() / 1000) : undefined
  };

  return jwt.sign(payload, CONFIG.RSA_PRIVATE_KEY, { algorithm: 'RS256' });
}

// JWT validation middleware
function validateJWT(token) {
  try {
    return jwt.verify(token, CONFIG.RSA_PUBLIC_KEY, { algorithm: 'RS256' });
  } catch (error) {
    throw new Error(`Invalid JWT: ${error.message}`);
  }
}

// Enhanced license validation
async function validateLicenseInDB(licenseKey, deviceId) {
  const { data: license, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .eq('device_hash', deviceId)
    .single();

  if (error || !license) {
    throw new Error('License not found');
  }

  // Check if license is active
  if (license.status !== 'active') {
    throw new Error(`License is ${license.status}`);
  }

  // Check expiration
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    // Auto-expire the license
    await supabase
      .from('licenses')
      .update({ status: 'expired' })
      .eq('license_key', licenseKey);
    throw new Error('License expired');
  }

  return license;
}

// Check for existing trial
async function checkExistingTrial(email, deviceId) {
  const { data: existingLicenses } = await supabase
    .from('licenses')
    .select('*')
    .or(`email.eq.${email},device_hash.eq.${deviceId}`)
    .eq('is_trial', true);

  return existingLicenses?.filter(l => l.status === 'active') || [];
}

// Enhanced email sending
async function sendTrialEmail(userName, userEmail, trialDays) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${CONFIG.EXTENSION_NAME} <${CONFIG.SENDER_EMAIL}>`,
        to: [userEmail],
        subject: `Welcome to your ${CONFIG.EXTENSION_NAME} ${trialDays}-Day Trial!`,
        html: `
          <h1>Welcome, ${userName}!</h1>
          <p>Your ${trialDays}-day trial for the ${CONFIG.EXTENSION_NAME} SketchUp extension has been successfully activated.</p>
          <p>Your trial is associated with this email address and locked to your device.</p>
          <p><strong>Trial expires:</strong> ${new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          <p>Enjoy using the extension!</p>
          <p>The ${CONFIG.EXTENSION_NAME} Team</p>
        `,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API Error:', errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }
    
    console.log(`Trial email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send trial email:', error);
    throw error;
  }
}

// Enhanced trial creation endpoint
app.post('/create-trial', async (req, res) => {
  console.log('[SERVER] Received create-trial request:', { ...req.body, device_id: req.body.device_id?.slice(0, 8) + '...' });
  
  try {
    const { name, email, device_id, extension_name } = req.body;
    
    // Validation
    if (!name || !email || !device_id) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['name', 'email', 'device_id'] 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for existing trials
    const existingTrials = await checkExistingTrial(email, device_id);
    if (existingTrials.length > 0) {
      return res.status(409).json({ 
        error: 'Trial already exists', 
        message: 'A trial license already exists for this email or device',
        existing_license: existingTrials[0].license_key
      });
    }

    // Create trial license
    const trialDays = CONFIG.TRIAL_DURATION_DAYS;
    const licenseKey = `${CONFIG.EXTENSION_NAME.slice(0, 3).toUpperCase()}-TRIAL-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

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
        extension_name: extension_name || CONFIG.EXTENSION_NAME,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create license: ${insertError.message}`);
    }

    // Send email (don't block response on email failure)
    sendTrialEmail(name, email, trialDays).catch(err => 
      console.error('Email sending failed (non-blocking):', err.message)
    );

    // Create JWT token
    const token = createJWT(newLicense, extension_name);

    console.log(`[SUCCESS] Trial created: ${licenseKey} for ${email}`);
    
    return res.status(201).json({ 
      jwt_token: token,
      license_key: licenseKey,
      expires_at: expiresAt.toISOString(),
      trial_days: trialDays
    });
    
  } catch (error) {
    console.error('[ERROR] Create trial failed:', error.message);
    return res.status(500).json({ 
      error: 'Failed to create trial',
      message: error.message 
    });
  }
});

// Enhanced license validation endpoint
app.post('/validate-license', async (req, res) => {
  console.log('[SERVER] Received validate-license request');
  
  try {
    const { license_key, device_id, jwt_token } = req.body;
    
    // Validate input
    if (!license_key || !device_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['license_key', 'device_id']
      });
    }

    // If JWT token provided, validate it first
    if (jwt_token) {
      try {
        const decoded = validateJWT(jwt_token);
        if (decoded.license_key !== license_key || decoded.device_id !== device_id) {
          return res.status(401).json({ error: 'JWT token mismatch' });
        }
      } catch (jwtError) {
        console.log('JWT validation failed:', jwtError.message);
        // Continue with database validation
      }
    }

    // Validate license in database
    const license = await validateLicenseInDB(license_key, device_id);
    
    // Update last_validated timestamp
    await supabase
      .from('licenses')
      .update({ last_validated: new Date().toISOString() })
      .eq('license_key', license_key);

    // Create fresh JWT token
    const token = createJWT(license);

    console.log(`[SUCCESS] License validated: ${license_key}`);
    
    return res.json({ 
      jwt_token: token,
      license_key: license.license_key,
      is_trial: license.is_trial,
      expires_at: license.expires_at,
      status: license.status
    });
    
  } catch (error) {
    console.error('[ERROR] License validation failed:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'License not found' });
    }
    if (error.message.includes('expired')) {
      return res.status(410).json({ error: 'License expired' });
    }
    if (error.message.includes('revoked') || error.message.includes('suspended')) {
      return res.status(403).json({ error: error.message });
    }
    
    return res.status(500).json({ 
      error: 'License validation failed',
      message: error.message
    });
  }
});

// License management endpoints
app.post('/revoke-license', async (req, res) => {
  try {
    const { license_key, reason } = req.body;
    
    if (!license_key) {
      return res.status(400).json({ error: 'Missing license_key' });
    }

    const { error } = await supabase
      .from('licenses')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoke_reason: reason || 'Manual revocation'
      })
      .eq('license_key', license_key);

    if (error) throw error;

    console.log(`[SUCCESS] License revoked: ${license_key}`);
    return res.json({ message: 'License revoked successfully' });
    
  } catch (error) {
    console.error('[ERROR] License revocation failed:', error.message);
    return res.status(500).json({ error: 'Failed to revoke license' });
  }
});

app.get('/license-status/:license_key', async (req, res) => {
  try {
    const { license_key } = req.params;
    
    const { data: license, error } = await supabase
      .from('licenses')
      .select('license_key, status, is_trial, expires_at, created_at, last_validated')
      .eq('license_key', license_key)
      .single();

    if (error || !license) {
      return res.status(404).json({ error: 'License not found' });
    }

    return res.json(license);
    
  } catch (error) {
    console.error('[ERROR] License status check failed:', error.message);
    return res.status(500).json({ error: 'Failed to check license status' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    extension: CONFIG.EXTENSION_NAME
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 ${CONFIG.EXTENSION_NAME} License Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`📧 Email sender: ${CONFIG.SENDER_EMAIL}`);
  console.log(`⏰ Trial duration: ${CONFIG.TRIAL_DURATION_DAYS} days`);
  console.log(`🔐 JWT issuer: ${CONFIG.JWT_ISSUER}`);
});