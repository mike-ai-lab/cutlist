// server.mjs 
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';


dotenv.config(); // load environment variables from .env


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = 'support@mimevents.com';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
// Handle RSA private key for both local and Vercel environments
let RSA_PRIVATE_KEY;
if (process.env.RSA_PRIVATE_KEY) {
  // In Vercel, the key comes as an environment variable
  RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
} else {
  // Local development - read from file
  try {
    RSA_PRIVATE_KEY = fs.readFileSync(path.join(process.cwd(), 'private_key.pem'), 'utf8');
  } catch (error) {
    console.error('Failed to load RSA private key:', error.message);
    process.exit(1);
  }
}

// Validate RSA key format
if (!RSA_PRIVATE_KEY || !RSA_PRIVATE_KEY.includes('-----BEGIN') || !RSA_PRIVATE_KEY.includes('-----END')) {
  console.error('Invalid RSA private key format. Key must be in PEM format.');
  process.exit(1);
}

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
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: 'Welcome to your AutoNestCut 7-Day Trial!',
        html: `
          <h1>Welcome, ${userName}!</h1>
          <p>Your 7-day trial for the AutoNestCut SketchUp extension has been successfully activated.</p>
          <p>Your trial is associated with this email address and locked to your device.</p>
          <p>Enjoy using the extension!</p>
          <p>The AutoNestCut Team</p>
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

async function sendLicenseEmail(userName, userEmail, licenseKey, type) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: 'Your AutoNestCut License Key',
        html: `
          <h1>Thank you for purchasing AutoNestCut, ${userName}!</h1>
          <p>Your ${type} license has been generated:</p>
          <h2 style="background: #f0f0f0; padding: 10px; font-family: monospace;">${licenseKey}</h2>
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Open SketchUp</li>
            <li>Load the AutoNestCut extension</li>
            <li>When prompted, enter your license key: <strong>${licenseKey}</strong></li>
          </ol>
          <p>Your license is now ready to use!</p>
          <p>For support, contact: muhamad.shkeir@gmail.com</p>
          <p>The AutoNestCut Team</p>
        `,
      }),
    });
    if (!response.ok) {
      console.error('Resend API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send license email:', error);
  }
}

async function sendLicenseEmailWithAttachment(userName, userEmail, licenseKey, duration) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: `Your AutoNestCut Extension (${duration})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to AutoNestCut, ${userName}!</h1>
            <p>Your license key is valid for <strong>${duration}</strong>.</p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>License Key:</h3>
              <code style="font-size: 18px; font-weight: bold;">${licenseKey}</code>
            </div>
            
            <h3>Quick Setup (3 steps):</h3>
            <ol>
              <li><strong>Download:</strong> Get the extension file from the attachment</li>
              <li><strong>Install:</strong> In SketchUp, go to Extensions → Extension Manager → Install Extension</li>
              <li><strong>Activate:</strong> Enter your license key: <code>${licenseKey}</code></li>
            </ol>
            
            <p><em>Note: This is a promotional license. Download and install the extension, then use your license key to activate it.</em></p>
            
            <p>For support: muhamad.shkeir@gmail.com</p>
            <p>The AutoNestCut Team</p>
          </div>
        `,
        attachments: [{
          filename: 'AutoNestCut_Extension.zip',
          content: 'UEsDBAoAAAAAAKxVUVMAAAAAAAAAAAAAAAAJAAAAZXh0ZW5zaW9uLw==', // Placeholder base64
          content_type: 'application/zip'
        }]
      }),
    });
    if (!response.ok) {
      console.error('Resend API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send license email:', error);
  }
}

async function sendTrialExpiryEmail(userName, userEmail) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: 'Your AutoNestCut Trial Has Expired',
        html: `
          <h1>Hi ${userName},</h1>
          <p>Your 7-day AutoNestCut trial has expired.</p>
          <p>We hope you enjoyed using AutoNestCut for your SketchUp projects!</p>
          <h2>Continue with a Full License</h2>
          <p>Purchase a full license to continue using AutoNestCut:</p>
          <ul>
            <li><strong>Lifetime License:</strong> Unlimited use forever</li>
            <li><strong>Annual License:</strong> One year of updates and support</li>
          </ul>
          <p><strong>Contact us to purchase:</strong> muhamad.shkeir@gmail.com</p>
          <p>Thank you for trying AutoNestCut!</p>
          <p>The AutoNestCut Team</p>
        `,
      }),
    });
    if (!response.ok) {
      console.error('Resend API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send expiry email:', error);
  }
}

async function sendGiftEmail(userName, userEmail, licenseKey, template, company, message) {
  const templates = {
    youtuber: {
      subject: '🎥 Special AutoNestCut License for Content Creators',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0078D4; margin-bottom: 10px;">🎥 AutoNestCut Creator License</h1>
          </div>
          <p>Hi ${userName}!</p>
          <p>We're excited to offer you a complimentary <strong>lifetime license</strong> for AutoNestCut as part of our content creator program.</p>
          ${company ? `<p>We love your work on <strong>${company}</strong>!</p>` : ''}
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><em>${message}</em></div>` : ''}
          <p>This professional SketchUp extension will help you create amazing woodworking content with automated nesting and cut lists.</p>
          <div style="background: #0078D4; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-family: monospace; letter-spacing: 2px;">${licenseKey}</h2>
          </div>
          <p><strong>How to activate:</strong></p>
          <ol>
            <li>Open SketchUp</li>
            <li>Load the AutoNestCut extension</li>
            <li>Enter your license key when prompted</li>
          </ol>
          <p>Thank you for being part of the AutoNestCut community!</p>
          <p>Best regards,<br>The AutoNestCut Team</p>
        </div>
      `
    },
    designer: {
      subject: '🎨 Professional AutoNestCut License',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0078D4; margin-bottom: 10px;">🎨 AutoNestCut Professional License</h1>
          </div>
          <p>Dear ${userName},</p>
          <p>We're pleased to provide you with a professional AutoNestCut license.</p>
          ${company ? `<p>For <strong>${company}</strong>:</p>` : ''}
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><em>${message}</em></div>` : ''}
          <p>This tool will streamline your design workflow with automated material optimization and professional cut lists.</p>
          <div style="background: #0078D4; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-family: monospace; letter-spacing: 2px;">${licenseKey}</h2>
          </div>
          <p><strong>Activation steps:</strong></p>
          <ol>
            <li>Open SketchUp</li>
            <li>Load the AutoNestCut extension</li>
            <li>Enter your license key when prompted</li>
          </ol>
          <p>Best regards,<br>The AutoNestCut Team</p>
        </div>
      `
    },
    company: {
      subject: '🏢 AutoNestCut Extended Trial',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0078D4; margin-bottom: 10px;">🏢 AutoNestCut Extended Trial</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Welcome to your extended <strong>30-day AutoNestCut trial</strong>!</p>
          ${company ? `<p>For <strong>${company}</strong>:</p>` : ''}
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><em>${message}</em></div>` : ''}
          <p>Explore all features of our professional nesting and cut list extension for your business needs.</p>
          <div style="background: #0078D4; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-family: monospace; letter-spacing: 2px;">${licenseKey}</h2>
          </div>
          <p><strong>Getting started:</strong></p>
          <ol>
            <li>Open SketchUp</li>
            <li>Load the AutoNestCut extension</li>
            <li>Enter your trial key when prompted</li>
          </ol>
          <p>Best regards,<br>The AutoNestCut Team</p>
        </div>
      `
    },
    educator: {
      subject: '🎓 AutoNestCut Educational License',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0078D4; margin-bottom: 10px;">🎓 AutoNestCut Educational License</h1>
          </div>
          <p>Dear Educator ${userName},</p>
          <p>Thank you for your dedication to education! Here's your special AutoNestCut license.</p>
          ${company ? `<p>For <strong>${company}</strong>:</p>` : ''}
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><em>${message}</em></div>` : ''}
          <p>Use this tool to teach students about efficient material usage and professional woodworking practices.</p>
          <div style="background: #0078D4; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-family: monospace; letter-spacing: 2px;">${licenseKey}</h2>
          </div>
          <p><strong>Setup instructions:</strong></p>
          <ol>
            <li>Open SketchUp</li>
            <li>Load the AutoNestCut extension</li>
            <li>Enter your license key when prompted</li>
          </ol>
          <p>Best regards,<br>The AutoNestCut Team</p>
        </div>
      `
    }
  };

  const template_data = templates[template] || templates.designer;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [userEmail],
        subject: template_data.subject,
        html: template_data.content,
      }),
    });
    if (!response.ok) {
      console.error('Resend API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send gift email:', error);
  }
}

app.post('/create-trial', async (req, res) => {
  console.log('[SERVER] Received create-trial request:', req.body);
  try {
    const { name, email, device_id } = req.body;
    if (!name || !email || !device_id) {
      return res.status(400).json({ error: 'Missing name, email, or device_id' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[SERVER] Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if device already had an ACTIVE trial
    const { data: existingDevice } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true)
      .eq('status', 'active');

    if (existingDevice && existingDevice.length > 0) {
      const trial = existingDevice[0];
      const expiresAt = new Date(trial.expires_at);
      const now = new Date();
      
      if (expiresAt > now) {
        console.log('[SERVER] Device has active trial:', device_id);
        return res.status(409).json({ error: 'Active trial already exists on this device' });
      }
    }
    
    // Check if device had any trial before (active or expired)
    const { data: anyTrial } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true);

    if (anyTrial && anyTrial.length > 0) {
      console.log('[SERVER] Device already used trial:', device_id);
      return res.status(409).json({ error: 'Trial already used on this device' });
    }

    const licenseKey = `PRM-TRIAL-${randomUUID().slice(0, 8).toUpperCase()}`;
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

    // Send email with proper error handling
    try {
      await sendTrialEmail(name, email);
      console.log('[SERVER] Trial email sent successfully');
    } catch (emailError) {
      console.log('[SERVER] Email send failed:', emailError.message);
    }

    let token;
    try {
      token = jwt.sign(
        {
          license_key: newLicense.license_key,
          device_id: newLicense.device_hash,
          is_trial: newLicense.is_trial,
          user_name: newLicense.user_name,
          email: newLicense.email,
          exp: Math.floor(expiresAt.getTime() / 1000),
        },
        RSA_PRIVATE_KEY,
        { algorithm: 'RS256' }
      );
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError.message);
      throw new Error('Failed to generate license token');
    }

    return res.json({ jwt_token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/check-trial', async (req, res) => {
  console.log('[SERVER] Received check-trial request:', req.body);
  try {
    const { device_id } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' });
    }

    const { data: existingTrials, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('device_hash', device_id)
      .eq('is_trial', true)
      .eq('status', 'active');

    console.log('[SERVER] Check-trial query result:', { data: existingTrials, error });

    if (error && error.code !== 'PGRST116') {
      console.error('[SERVER] Supabase error:', error);
      throw error;
    }

    // Get the most recent trial
    const existingTrial = existingTrials && existingTrials.length > 0 ? 
      existingTrials.sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at))[0] : null;

    if (!existingTrial) {
      console.log('[SERVER] No active trial found for device:', device_id);
      return res.json({ has_trial: false, message: 'No active trial found' });
    }

    const expiresAt = new Date(existingTrial.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('[SERVER] Trial expired for device:', device_id);
      return res.json({ has_trial: false, expired: true, message: 'Trial expired' });
    }

    const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    console.log('[SERVER] Generating JWT for trial:', existingTrial.license_key);

    let token;
    try {
      token = jwt.sign(
        {
          license_key: existingTrial.license_key,
          device_id: existingTrial.device_hash,
          is_trial: existingTrial.is_trial,
          user_name: existingTrial.user_name,
          email: existingTrial.email,
          exp: Math.floor(expiresAt.getTime() / 1000),
        },
        RSA_PRIVATE_KEY,
        { algorithm: 'RS256' }
      );
      console.log('[SERVER] JWT generated successfully');
    } catch (jwtError) {
      console.error('[SERVER] JWT signing error:', jwtError.message);
      console.error('[SERVER] JWT error stack:', jwtError.stack);
      throw new Error('Failed to generate license token');
    }

    console.log('[SERVER] Active trial found, remaining days:', remainingDays);
    return res.json({ 
      has_trial: true,
      remaining_days: remainingDays,
      jwt_token: token,
      message: `Trial has ${remainingDays} days remaining`
    });
  } catch (error) {
    console.error('[SERVER] Check-trial error:', error.message);
    console.error('[SERVER] Check-trial stack:', error.stack);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/validate-license', async (req, res) => {
  try {
    const { license_key, device_id, country } = req.body;
    if (!license_key || !device_id) {
      return res.status(400).json({ error: 'Missing license_key or device_id' });
    }

    // First check if license exists (without device binding for new activations)
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('status', 'active');

    if (error || !licenses || licenses.length === 0) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    let license = licenses[0];

    // If license has no device binding, bind it to this device and log activation
    if (!license.device_hash) {
      const { data: updatedLicense } = await supabase
        .from('licenses')
        .update({ 
          device_hash: device_id,
          activated_at: new Date().toISOString(),
          country: country || null
        })
        .eq('license_key', license_key)
        .select()
        .single();
      license = updatedLicense;
      
      console.log(`[LICENSE ACTIVATED] Key: ${license_key}, User: ${license.user_name}, Email: ${license.email}, Country: ${country}`);
    } else if (license.device_hash !== device_id) {
      return res.status(403).json({ error: 'License is bound to another device' });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(410).json({ error: 'License expired' });
    }

    let token;
    try {
      token = jwt.sign(
        {
          license_key: license.license_key,
          device_id: license.device_hash,
          is_trial: license.is_trial,
          user_name: license.user_name,
          email: license.email,
          exp: license.expires_at ? Math.floor(new Date(license.expires_at).getTime() / 1000) : undefined,
        },
        RSA_PRIVATE_KEY,
        { algorithm: 'RS256' }
      );
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError.message);
      throw new Error('Failed to generate license token');
    }

    return res.json({ jwt_token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check for expired trials and send emails
app.get('/admin/check-expired-trials', async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const { data: expiredTrials } = await supabase
      .from('licenses')
      .select('*')
      .eq('is_trial', true)
      .eq('status', 'active')
      .lt('expires_at', now.toISOString())
      .gt('expires_at', oneDayAgo.toISOString());

    let emailsSent = 0;
    for (const trial of expiredTrials || []) {
      await sendTrialExpiryEmail(trial.user_name, trial.email);
      
      // Mark as expired
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', trial.id);
      
      emailsSent++;
    }

    res.json({ message: `Processed ${emailsSent} expired trials` });
  } catch (error) {
    console.error('Check expired trials error:', error);
    res.status(500).json({ error: 'Failed to check expired trials' });
  }
});

// Serve admin dashboards
app.get('/admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'admin-charcoal.html'));
});

app.get('/admin-legacy', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'admin.html'));
});

// Serve purchase pages
app.get('/purchase-paypal.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'purchase-paypal.html'));
});

app.get('/purchase-legacy', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'purchase.html'));
});

// Serve new animated purchase page as default
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(process.cwd(), 'purchase-paypal.html'));
  } catch (error) {
    console.error('Error serving purchase page:', error);
    res.status(500).send('Server Error');
  }
});

// Main purchase page
app.get('/purchase', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'purchase-paypal.html'));
});

app.get('/buy', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'purchase-minimal.html'));
});

// Disable license
app.post('/admin/disable-license', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) {
      return res.status(400).json({ error: 'Missing license_key' });
    }

    await supabase
      .from('licenses')
      .update({ status: 'disabled' })
      .eq('license_key', license_key);

    res.json({ message: 'License disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable license' });
  }
});

// Enable license
app.post('/admin/enable-license', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) {
      return res.status(400).json({ error: 'Missing license_key' });
    }

    await supabase
      .from('licenses')
      .update({ status: 'active' })
      .eq('license_key', license_key);

    res.json({ message: 'License enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable license' });
  }
});

// PayPal access token helper
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

// Complete purchase after PayPal payment
app.post('/complete-purchase', async (req, res) => {
  try {
    const { orderID, name, email, type, details } = req.body;
    
    if (!orderID || !name || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate license after successful payment
    const licenseKey = `ANC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const expiresAt = type === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        user_name: name,
        email: email,
        device_hash: null,
        expires_at: expiresAt?.toISOString(),
        is_trial: false,
        status: 'active',
        payment_id: orderID
      });
    
    // Send license email
    await sendLicenseEmail(name, email, licenseKey, type);
    
    res.json({ success: true, message: 'License generated and sent' });
  } catch (error) {
    console.error('Complete purchase error:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Get PayPal client ID for frontend
app.get('/paypal-client-id', (req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID });
});

// Admin dashboard data
app.get('/admin/dashboard', async (req, res) => {
  try {
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const now = new Date();
    const activeTrials = allLicenses.filter(l => l.is_trial && l.status === 'active' && new Date(l.expires_at) > now).length;
    const expiredTrials = allLicenses.filter(l => l.is_trial && (l.status !== 'active' || new Date(l.expires_at) <= now)).length;
    const fullLicenses = allLicenses.filter(l => !l.is_trial).length;
    
    res.json({
      totalUsers: allLicenses.length,
      activeTrials,
      expiredTrials,
      fullLicenses,
      recentActivity: allLicenses.slice(0, 20)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Professional admin dashboard with analytics (auto-refresh every 30 seconds)
app.get('/admin/dashboard-pro', async (req, res) => {
  try {
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const now = new Date();
    const activeTrials = allLicenses.filter(l => l.is_trial && l.status === 'active' && new Date(l.expires_at) > now);
    const expiredTrials = allLicenses.filter(l => l.is_trial && (l.status !== 'active' || new Date(l.expires_at) <= now));
    const fullLicenses = allLicenses.filter(l => !l.is_trial && l.status === 'active');
    const disabledLicenses = allLicenses.filter(l => l.status === 'disabled');
    const giftLicenses = allLicenses.filter(l => l.campaign_tag && l.campaign_tag.includes('gift'));
    
    // Calculate analytics
    const activatedLicenses = allLicenses.filter(l => l.device_hash);
    const unusedLicenses = allLicenses.filter(l => !l.device_hash);
    const conversionRate = expiredTrials.length > 0 ? Math.round((fullLicenses.length / expiredTrials.length) * 100) : 0;
    const activationRate = allLicenses.length > 0 ? Math.round((activatedLicenses.length / allLicenses.length) * 100) : 0;
    const avgTrialDays = activeTrials.length > 0 ? Math.round(
      activeTrials.reduce((sum, trial) => {
        const used = Math.max(0, 7 - Math.ceil((new Date(trial.expires_at) - now) / (24 * 60 * 60 * 1000)));
        return sum + used;
      }, 0) / activeTrials.length
    ) : 0;
    const monthlyRevenue = fullLicenses.filter(l => {
      const issued = new Date(l.issued_at);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return issued > monthAgo;
    }).length * 150; // Estimate
    const giftConversion = giftLicenses.length > 0 ? Math.round((giftLicenses.filter(l => !l.is_trial).length / giftLicenses.length) * 100) : 0;
    
    // Country analytics
    const countryStats = {};
    activatedLicenses.forEach(l => {
      if (l.country) {
        countryStats[l.country] = (countryStats[l.country] || 0) + 1;
      }
    });
    
    res.json({
      totalUsers: allLicenses.length,
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length,
      fullLicenses: fullLicenses.length,
      disabledLicenses: disabledLicenses.length,
      giftsSent: giftLicenses.length,
      activatedLicenses: activatedLicenses.length,
      unusedLicenses: unusedLicenses.length,
      conversionRate,
      activationRate,
      avgTrialDays,
      monthlyRevenue,
      giftConversion,
      countryStats,
      recentActivity: allLicenses,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Generate license key (admin only)
app.post('/admin/generate-license', async (req, res) => {
  try {
    const { name, email, type, campaign_tag, custom_days } = req.body;
    if (!name || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const licenseKey = `ANC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    let expiresAt = null;
    
    if (type === 'custom' && custom_days) {
      expiresAt = new Date(Date.now() + custom_days * 24 * 60 * 60 * 1000);
    } else if (type === 'annual') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const { data: newLicense } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        user_name: name,
        email: email,
        device_hash: null,
        expires_at: expiresAt?.toISOString(),
        is_trial: false,
        status: 'active',
        campaign_tag: campaign_tag || null
      })
      .select()
      .single();

    // Send license email with attachment
    const daysText = type === 'custom' ? `${custom_days} days` : type;
    await sendLicenseEmailWithAttachment(name, email, licenseKey, daysText);

    res.json({ license_key: licenseKey, message: 'License generated and email sent' });
  } catch (error) {
    console.error('Generate license error:', error);
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

// Send gift license
app.post('/admin/send-gift-license', async (req, res) => {
  try {
    const { name, email, company, campaign, message, template } = req.body;
    if (!name || !email || !template) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine license type based on template
    const licenseType = template === 'company' ? 'trial' : 'lifetime';
    const isTrialLicense = licenseType === 'trial';
    const licenseKey = `ANC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const expiresAt = isTrialLicense ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null; // 30 days for company trials

    const { data: newLicense } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        user_name: company ? `${name} (${company})` : name,
        email: email,
        device_hash: null,
        expires_at: expiresAt?.toISOString(),
        is_trial: isTrialLicense,
        status: 'active',
        campaign_tag: `gift-${template}-${campaign || 'general'}`
      })
      .select()
      .single();

    // Send gift email
    await sendGiftEmail(name, email, licenseKey, template, company, message);

    res.json({ license_key: licenseKey, message: 'Gift license sent successfully' });
  } catch (error) {
    console.error('Send gift license error:', error);
    res.status(500).json({ error: 'Failed to send gift license' });
  }
});

// Bulk license generation
app.post('/admin/bulk-licenses', async (req, res) => {
  try {
    const { type, emails, campaign } = req.body;
    if (!type || !emails || emails.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const licenseConfigs = {
      workshop: { isTrialLicense: true, days: 30, template: 'company' },
      event: { isTrialLicense: false, days: null, template: 'youtuber' },
      company: { isTrialLicense: false, days: 365, template: 'designer' }
    };

    const config = licenseConfigs[type];
    if (!config) {
      return res.status(400).json({ error: 'Invalid license type' });
    }

    let processed = 0;
    const results = [];

    for (const email of emails) {
      if (!email.trim()) continue;
      
      try {
        const licenseKey = `ANC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
        const expiresAt = config.days ? new Date(Date.now() + config.days * 24 * 60 * 60 * 1000) : null;

        await supabase
          .from('licenses')
          .insert({
            license_key: licenseKey,
            user_name: `Bulk ${type} recipient`,
            email: email.trim(),
            device_hash: null,
            expires_at: expiresAt?.toISOString(),
            is_trial: config.isTrialLicense,
            status: 'active',
            campaign_tag: `bulk-${type}-${campaign || 'general'}`
          });

        await sendGiftEmail(`Recipient`, email.trim(), licenseKey, config.template, campaign, 
          `Thank you for participating in our ${campaign || type} program!`);
        
        processed++;
        results.push({ email: email.trim(), license_key: licenseKey, status: 'success' });
      } catch (error) {
        console.error(`Failed to process ${email}:`, error);
        results.push({ email: email.trim(), status: 'failed', error: error.message });
      }
    }

    res.json({ success: true, processed, results });
  } catch (error) {
    console.error('Bulk licenses error:', error);
    res.status(500).json({ error: 'Failed to process bulk licenses' });
  }
});

// Export endpoints
app.get('/admin/export/licenses', async (req, res) => {
  try {
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const csv = [
      'License Key,User Name,Email,Type,Status,Issued At,Expires At,Campaign Tag',
      ...licenses.map(l => [
        l.license_key,
        l.user_name,
        l.email,
        l.is_trial ? 'Trial' : 'Full',
        l.status,
        l.issued_at,
        l.expires_at || 'Never',
        l.campaign_tag || ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=licenses.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export licenses' });
  }
});

app.get('/admin/export/analytics', async (req, res) => {
  try {
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const analytics = {
      totalLicenses: licenses.length,
      trialLicenses: licenses.filter(l => l.is_trial).length,
      fullLicenses: licenses.filter(l => !l.is_trial).length,
      activeLicenses: licenses.filter(l => l.status === 'active').length,
      activatedLicenses: licenses.filter(l => l.device_hash).length,
      unusedLicenses: licenses.filter(l => !l.device_hash).length,
      giftLicenses: licenses.filter(l => l.campaign_tag && l.campaign_tag.includes('gift')).length,
      bulkLicenses: licenses.filter(l => l.campaign_tag && l.campaign_tag.includes('bulk')).length,
      activationRate: licenses.length > 0 ? Math.round((licenses.filter(l => l.device_hash).length / licenses.length) * 100) : 0,
      exportedAt: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

app.get('/admin/export/gifts', async (req, res) => {
  try {
    const { data: gifts } = await supabase
      .from('licenses')
      .select('*')
      .like('campaign_tag', '%gift%')
      .order('issued_at', { ascending: false });

    const csv = [
      'License Key,User Name,Email,Template,Campaign,Issued At,Status',
      ...gifts.map(g => {
        const template = g.campaign_tag ? g.campaign_tag.split('-')[1] : 'unknown';
        const campaign = g.campaign_tag ? g.campaign_tag.split('-').slice(2).join('-') : '';
        return [
          g.license_key,
          g.user_name,
          g.email,
          template,
          campaign,
          g.issued_at,
          g.status
        ].join(',');
      })
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=gift-campaigns.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export gift campaigns' });
  }
});

// Send renewal reminder
app.post('/admin/send-renewal-reminder', async (req, res) => {
  try {
    const { license_key, email, name } = req.body;
    if (!license_key || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [email],
        subject: 'AutoNestCut License Renewal Reminder',
        html: `
          <h1>Hi ${name},</h1>
          <p>This is a friendly reminder about your AutoNestCut license.</p>
          <p>We noticed your license may be expiring soon. To continue enjoying all the features of AutoNestCut, consider renewing your license.</p>
          <h3>Renewal Options:</h3>
          <ul>
            <li><strong>Annual License:</strong> $39/year - One year of updates and support</li>
            <li><strong>Lifetime License:</strong> $69 one-time - Lifetime updates and priority support</li>
          </ul>
          <p><a href="https://autonestcutserver-moeshks-projects.vercel.app" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Renew License</a></p>
          <p>Thank you for using AutoNestCut!</p>
          <p>The AutoNestCut Team</p>
        `,
      }),
    });

    if (response.ok) {
      res.json({ success: true, message: 'Renewal reminder sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Send renewal reminder error:', error);
    res.status(500).json({ error: 'Failed to send renewal reminder' });
  }
});

// Send gift to existing user
app.post('/admin/send-user-gift', async (req, res) => {
  try {
    const { license_key, email, name, gift_type } = req.body;
    if (!license_key || !email || !name || !gift_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let giftLicenseKey = null;
    let emailContent = '';
    
    if (gift_type === 'extension') {
      // Extend current license by 30 days
      const { data: currentLicense } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', license_key)
        .single();
      
      if (currentLicense) {
        const currentExpiry = new Date(currentLicense.expires_at || Date.now());
        const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await supabase
          .from('licenses')
          .update({ expires_at: newExpiry.toISOString() })
          .eq('license_key', license_key);
        
        emailContent = `
          <h1>Great News, ${name}!</h1>
          <p>We've extended your AutoNestCut license by 30 days as a special gift!</p>
          <p>Your license <strong>${license_key}</strong> now expires on: <strong>${newExpiry.toLocaleDateString()}</strong></p>
          <p>Continue enjoying all the features of AutoNestCut!</p>
        `;
      }
    } else if (gift_type === 'upgrade') {
      // Create new lifetime license
      giftLicenseKey = `ANC-GIFT-${randomUUID().slice(0, 8).toUpperCase()}`;
      
      await supabase
        .from('licenses')
        .insert({
          license_key: giftLicenseKey,
          user_name: name,
          email: email,
          device_hash: null,
          expires_at: null,
          is_trial: false,
          status: 'active',
          campaign_tag: 'admin-gift-upgrade'
        });
      
      emailContent = `
        <h1>Congratulations, ${name}!</h1>
        <p>You've been upgraded to a <strong>Lifetime AutoNestCut License</strong> as a special gift!</p>
        <p>Your new license key: <strong>${giftLicenseKey}</strong></p>
        <p>This license never expires and includes all future updates!</p>
        <p>Thank you for being a valued AutoNestCut user!</p>
      `;
    } else {
      // Promotional offer
      emailContent = `
        <h1>Special Offer for ${name}!</h1>
        <p>We have a special promotional offer just for you!</p>
        <p>Upgrade to a Lifetime AutoNestCut License for only <strong>$49</strong> (normally $69)!</p>
        <p>This limited-time offer includes:</p>
        <ul>
          <li>Lifetime access to all features</li>
          <li>All future updates included</li>
          <li>Priority support</li>
          <li>No recurring payments</li>
        </ul>
        <p><a href="https://autonestcutserver-moeshks-projects.vercel.app" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Claim Special Offer</a></p>
      `;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AutoNestCut <${SENDER_EMAIL}>`,
        to: [email],
        subject: gift_type === 'extension' ? 'AutoNestCut License Extended!' : 
                gift_type === 'upgrade' ? 'AutoNestCut Lifetime License Gift!' : 
                'Special AutoNestCut Offer Just for You!',
        html: emailContent + '<p>The AutoNestCut Team</p>',
      }),
    });

    if (response.ok) {
      res.json({ success: true, message: 'Gift sent successfully', license_key: giftLicenseKey });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Send user gift error:', error);
    res.status(500).json({ error: 'Failed to send gift' });
  }
});

// Excel report generation
app.get('/admin/export/excel-report', async (req, res) => {
  try {
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const now = new Date();
    const activeTrials = allLicenses.filter(l => l.is_trial && l.status === 'active' && new Date(l.expires_at) > now);
    const expiredTrials = allLicenses.filter(l => l.is_trial && (l.status !== 'active' || new Date(l.expires_at) <= now));
    const fullLicenses = allLicenses.filter(l => !l.is_trial && l.status === 'active');
    const activatedLicenses = allLicenses.filter(l => l.device_hash);
    
    // Create comprehensive Excel-style report
    const report = {
      summary: {
        totalLicenses: allLicenses.length,
        activeTrials: activeTrials.length,
        expiredTrials: expiredTrials.length,
        fullLicenses: fullLicenses.length,
        activatedLicenses: activatedLicenses.length,
        conversionRate: expiredTrials.length > 0 ? Math.round((fullLicenses.length / expiredTrials.length) * 100) : 0,
        activationRate: allLicenses.length > 0 ? Math.round((activatedLicenses.length / allLicenses.length) * 100) : 0,
        reportDate: now.toISOString()
      },
      licenses: allLicenses.map(l => ({
        userName: l.user_name,
        email: l.email,
        licenseKey: l.license_key,
        type: l.is_trial ? 'Trial' : 'Full',
        status: l.status,
        activated: l.device_hash ? 'Yes' : 'No',
        country: l.country || 'Unknown',
        issuedDate: l.issued_at,
        expiresDate: l.expires_at || 'Never',
        remainingDays: l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at) - now) / (1000 * 60 * 60 * 24))) : 'Unlimited',
        campaignTag: l.campaign_tag || 'Direct'
      }))
    };

    // Store in Supabase Storage
    const fileName = `autonestcut-report-${now.toISOString().split('T')[0]}.json`;
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, JSON.stringify(report, null, 2), {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      } else {
        console.log('Report stored in Supabase:', fileName);
      }
    } catch (storageError) {
      console.error('Storage operation failed:', storageError);
    }

    res.json(report);
  } catch (error) {
    console.error('Excel report error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Daily report cron endpoint
app.get('/api/daily-report', async (req, res) => {
  try {
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    const now = new Date();
    const activeTrials = allLicenses.filter(l => l.is_trial && l.status === 'active' && new Date(l.expires_at) > now);
    const expiredTrials = allLicenses.filter(l => l.is_trial && (l.status !== 'active' || new Date(l.expires_at) <= now));
    const fullLicenses = allLicenses.filter(l => !l.is_trial && l.status === 'active');
    const activatedLicenses = allLicenses.filter(l => l.device_hash);
    
    const dailyReport = {
      reportType: 'Daily AutoNestCut Analytics Report',
      generatedAt: now.toISOString(),
      summary: {
        totalLicenses: allLicenses.length,
        activeTrials: activeTrials.length,
        expiredTrials: expiredTrials.length,
        fullLicenses: fullLicenses.length,
        activatedLicenses: activatedLicenses.length,
        conversionRate: expiredTrials.length > 0 ? Math.round((fullLicenses.length / expiredTrials.length) * 100) : 0,
        activationRate: allLicenses.length > 0 ? Math.round((activatedLicenses.length / allLicenses.length) * 100) : 0
      },
      detailedData: allLicenses.map(l => ({
        userName: l.user_name,
        email: l.email,
        licenseKey: l.license_key,
        type: l.is_trial ? 'Trial' : 'Full',
        status: l.status,
        activated: l.device_hash ? 'Yes' : 'No',
        country: l.country || 'Unknown',
        issuedDate: l.issued_at,
        expiresDate: l.expires_at || 'Never',
        remainingDays: l.expires_at ? Math.max(0, Math.ceil((new Date(l.expires_at) - now) / (1000 * 60 * 60 * 24))) : 'Unlimited'
      }))
    };

    const fileName = `daily-reports/autonestcut-daily-${now.toISOString().split('T')[0]}.json`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, JSON.stringify(dailyReport, null, 2), {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Daily report storage error:', uploadError);
      } else {
        console.log(`Daily report stored: ${fileName}`);
      }
    } catch (storageError) {
      console.error('Storage operation failed:', storageError);
    }

    res.json({ success: true, message: 'Daily report generated', fileName });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hasResendKey: !!RESEND_API_KEY,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY,
    hasRsaKey: !!RSA_PRIVATE_KEY,
    hasPayPalClientId: !!PAYPAL_CLIENT_ID,
    hasPayPalSecret: !!PAYPAL_CLIENT_SECRET,
    rsaKeyFormat: RSA_PRIVATE_KEY ? (RSA_PRIVATE_KEY.includes('-----BEGIN') ? 'valid' : 'invalid') : 'missing'
  });
});

app.listen(3000, () => console.log('License server running on http://localhost:3000'));
