/**
 * PARAMETRIX License Admin Tool (Stable Version)
 * Handles: Create, List, Revoke
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// === CONFIGURATION ===
const SUPABASE_URL = 'https://hbslewdkkgwsaohjyzak.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhic2xld2Rra2d3c2FvaGp5emFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzM5NDE2MSwiZXhwIjoyMDU4OTcwMTYxfQ.xbpxYHH5UCdszrAQc39GBgkwBNjzCzOo79M1vonSoyM';

// === INITIALIZE SUPABASE ===
console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('✅ Connected.');

// === LICENSE GENERATION FUNCTION ===
function generateLicenseKey() {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PRM-${part1}-${part2}`;
}

// === CREATE LICENSE ===
async function createLicense(userName, email, isTrial = false) {
  console.log(`🚀 Creating license for "${userName}" (${isTrial ? 'Trial' : 'Full'})...`);
  try {
    const licenseKey = generateLicenseKey();
    const expiresAt = isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

    const { error } = await supabase
      .from('licenses')
      .insert([
        {
          license_key: licenseKey,
          user_name: userName,
          email: email, // <-- ADDED EMAIL
          device_hash: '',
          expires_at: expiresAt,
          is_trial: isTrial,
          status: 'active'
        }
      ]);

    if (error) throw error;

    console.log('✅ License created successfully!');
    console.log('---------------------------');
    console.log(`License Key: ${licenseKey}`);
    console.log(`User: ${userName}`);
    console.log(`Email: ${email || 'N/A'}`);
    console.log(`Type: ${isTrial ? 'Trial (7 days)' : 'Full License'}`);
    console.log(`Status: Active`);
    console.log('---------------------------');
  } catch (err) {
    console.error('❌ Error creating license:', err.message);
  }
}

// === LIST LICENSES ===
async function listLicenses() {
  console.log('📡 Getting all licenses...');
  const { data, error } = await supabase.from('licenses').select('*');

  if (error) {
    console.error('❌ Error listing licenses:', error.message);
    return;
  }

  console.table(data);
}

// === REVOKE LICENSE ===
async function revokeLicense(licenseKey) {
  console.log(`📡 Revoking license: ${licenseKey}`);
  const { data, error } = await supabase
    .from('licenses')
    .update({ status: 'revoked' })
    .eq('license_key', licenseKey)
    .select();

  if (error) {
    console.error('❌ Error revoking license:', error.message);
    return;
  }

  console.log('✅ License revoked.');
  console.table(data);
}

// === MAIN ENTRY ===
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  node admin.mjs generate "User Name" --email "user@example.com"');
    console.log('  node admin.mjs generate "Trial User" --trial');
    console.log('  node admin.mjs list');
    console.log('  node admin.mjs revoke PRM-XXXX-XXXX');
    return;
  }

  if (command === 'generate') {
    const userName = args[1];
    const isTrial = args.includes('--trial');
    const emailIndex = args.indexOf('--email');
    const email = emailIndex !== -1 && args[emailIndex + 1] ? args[emailIndex + 1] : null;
    await createLicense(userName, email, isTrial);
  } else if (command === 'list') {
    await listLicenses();
  } else if (command === 'revoke') {
    await revokeLicense(args[1]);
  } else {
    console.log('❌ Unknown command.');
  }
}

// === ALWAYS RUN MAIN ===
main();