// AutoNestCut Server Test Script
// Run with: node test_server.js

const fs = require('fs');
const path = require('path');

console.log('🧪 AutoNestCut Server Test Suite');
console.log('================================');

// Test 1: Check required files exist
console.log('\n1. 📁 Checking server files...');
const requiredFiles = [
  'server.mjs',
  'package.json',
  '.env',
  'admin-charcoal.html',
  'purchase-paypal.html',
  'private_key.pem'
];

let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Test 2: Check package.json dependencies
console.log('\n2. 📦 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'cors', 'node-fetch', 'jsonwebtoken', '@supabase/supabase-js', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep} - MISSING`);
      filesOk = false;
    }
  });
} catch (e) {
  console.log(`   ❌ Error reading package.json: ${e.message}`);
  filesOk = false;
}

// Test 3: Check .env file
console.log('\n3. 🔐 Checking environment variables...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'RESEND_API_KEY',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`   ✅ ${envVar}`);
    } else {
      console.log(`   ❌ ${envVar} - MISSING`);
      filesOk = false;
    }
  });
} catch (e) {
  console.log(`   ❌ Error reading .env: ${e.message}`);
  filesOk = false;
}

// Test 4: Check private key
console.log('\n4. 🔑 Checking RSA private key...');
try {
  const keyContent = fs.readFileSync('private_key.pem', 'utf8');
  if (keyContent.includes('-----BEGIN') && keyContent.includes('-----END')) {
    console.log('   ✅ RSA private key format valid');
  } else {
    console.log('   ❌ RSA private key format invalid');
    filesOk = false;
  }
} catch (e) {
  console.log(`   ❌ Error reading private key: ${e.message}`);
  filesOk = false;
}

// Test 5: Check HTML files
console.log('\n5. 🌐 Checking HTML files...');
const htmlFiles = ['admin-charcoal.html', 'purchase-paypal.html', 'extension-purchase.html'];
htmlFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('<html') && content.includes('</html>')) {
      console.log(`   ✅ ${file} - Valid HTML`);
    } else {
      console.log(`   ⚠️ ${file} - May not be valid HTML`);
    }
  } catch (e) {
    console.log(`   ❌ ${file} - Error: ${e.message}`);
  }
});

// Final result
console.log('\n🏁 Test Results:');
if (filesOk) {
  console.log('✅ All tests passed! Server should work correctly.');
  console.log('\n🚀 To start server:');
  console.log('   npm install');
  console.log('   node server.mjs');
  console.log('\n🌐 Server will be available at:');
  console.log('   • Admin: http://localhost:3000/admin');
  console.log('   • Purchase: http://localhost:3000/purchase');
  console.log('   • Health: http://localhost:3000/health');
} else {
  console.log('❌ Some tests failed. Please fix the issues above.');
}

console.log('\n================================');
console.log('Test complete!');