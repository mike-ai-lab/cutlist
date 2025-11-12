# AutoNestCut License Server Setup Documentation

## Issues Fixed and Solutions

### 1. JWT RSA Private Key Issue
**Problem**: `Error: secretOrPrivateKey must be an asymmetric key when using RS256`

**Root Cause**: Server was trying to read RSA private key from environment variable with string replacement, but the key formatting was incorrect.

**Solution**: Modified server to read private key directly from `private_key.pem` file.

**Code Changes in `server.mjs`**:
```javascript
// OLD (problematic):
const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');

// NEW (working):
import fs from 'fs';
import path from 'path';
const RSA_PRIVATE_KEY = fs.readFileSync(path.join(process.cwd(), 'private_key.pem'), 'utf8');
```

### 2. Resend API Key Issue
**Problem**: `Resend API Error: {"statusCode":401,"name":"validation_error","message":"API key is invalid"}`

**Root Cause**: Wrong API key was being used from CSV export file (ID instead of actual token).

**Solution**: 
1. Get complete API key from Resend dashboard
2. Update `.env` file with correct key: `re_EeaM3AnG_Gtfp3oryrBdVjfr9VCWwd5do`

## Required Files Structure
```
AutoNestCutServer/
├── .env                    # Environment variables
├── server.mjs             # Main server file
├── private_key.pem        # RSA private key file
├── public_key.pem         # RSA public key file (optional)
├── package.json
└── package-lock.json
```

## Environment Variables (.env)
```
RESEND_API_KEY=re_EeaM3AnG_Gtfp3oryrBdVjfr9VCWwd5do
SUPABASE_URL=https://hbslewdkkgwsaohjyzak.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Key Points
1. **Private Key**: Must be in separate `.pem` file, not in environment variable
2. **Resend API Key**: Must be complete token from dashboard, not CSV export ID
3. **File Reading**: Server reads `private_key.pem` from current working directory
4. **Restart Required**: Server must be restarted after any configuration changes

## Troubleshooting Steps
1. Verify `private_key.pem` exists and contains valid RSA private key
2. Verify Resend API key is complete and starts with `re_`
3. Check server logs for specific error messages
4. Restart server after any changes
5. Test with SketchUp extension

## Server Start Command
```bash
node server.mjs
```

## Success Indicators
- Server starts without JWT errors
- No Resend API validation errors
- SketchUp extension receives successful responses (not 500 errors)