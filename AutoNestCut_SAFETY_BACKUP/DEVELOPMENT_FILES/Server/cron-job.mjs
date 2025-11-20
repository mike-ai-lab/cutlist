// Cron job to check expired trials daily
// Run this with: node cron-job.mjs

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'https://autonestcutserver-2kocbb36g-moeshks-projects.vercel.app';

async function checkExpiredTrials() {
  try {
    console.log('Checking for expired trials...');
    
    const response = await fetch(`${SERVER_URL}/admin/check-expired-trials`);
    const result = await response.json();
    
    console.log('Result:', result.message);
  } catch (error) {
    console.error('Error checking expired trials:', error.message);
  }
}

// Run immediately
checkExpiredTrials();