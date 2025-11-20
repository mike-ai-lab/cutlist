// setup-vercel-env.js
// This script helps format the RSA private key for Vercel environment variables

import fs from 'fs';

try {
  const privateKey = fs.readFileSync('./private_key.pem', 'utf8');
  
  // Format for Vercel environment variable (escape newlines)
  const formattedKey = privateKey.replace(/\n/g, '\\n');
  
  console.log('='.repeat(80));
  console.log('RSA_PRIVATE_KEY value for Vercel environment variable:');
  console.log('='.repeat(80));
  console.log(formattedKey);
  console.log('='.repeat(80));
  console.log('\nCopy the above value and set it as RSA_PRIVATE_KEY in your Vercel dashboard.');
  console.log('Go to: https://vercel.com/dashboard -> Your Project -> Settings -> Environment Variables');
  
} catch (error) {
  console.error('Error reading private key:', error.message);
}