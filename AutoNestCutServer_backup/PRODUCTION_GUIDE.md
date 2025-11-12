# Production License Server Guide

## 🚀 Production Features Implemented

### 1. Enhanced JWT Signing (RS256)
- **Complete JWT payload** with all required fields:
  - `license_key` - License identifier
  - `device_id` - Device hash for binding
  - `extension_name` - Extension identifier
  - `exp` - Expiration timestamp
  - `iss` - JWT issuer
  - `sub` - Subject (license key)
  - `user_email` - User email
  - `status` - License status
  - `is_trial` - Trial flag

### 2. Robust Server-side Validation
- **Expired license detection** with auto-status update
- **Device hash mismatch** protection
- **License status checks** (active, revoked, suspended, expired)
- **JWT token validation** with public key verification
- **Email format validation**
- **Duplicate trial prevention**

### 3. Configurable Trial System
- **Environment-based duration**: Set `TRIAL_DURATION_DAYS` in .env
- **Extension-specific trials**: Support multiple extensions
- **Trial limit enforcement**: One trial per email/device
- **Automatic expiration handling**

### 4. License Management
- **Manual license revocation** via `/revoke-license` endpoint
- **License status checking** via `/license-status/:license_key`
- **Last validation tracking**
- **Comprehensive audit trail**

## 📁 File Structure
```
AutoNestCutServer/
├── server_production.mjs     # Production server
├── .env.production          # Production config
├── private_key.pem          # RSA private key
├── public_key.pem           # RSA public key
├── PRODUCTION_GUIDE.md      # This guide
└── package.json
```

## 🔧 Configuration

### Environment Variables (.env.production)
```bash
# Required
RESEND_API_KEY=re_EeaM3AnG_Gtfp3oryrBdVjfr9VCWwd5do
SUPABASE_URL=https://hbslewdkkgwsaohjyzak.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (with defaults)
SENDER_EMAIL=support@mimevents.com
TRIAL_DURATION_DAYS=7
EXTENSION_NAME=PARAMETRIX
JWT_ISSUER=parametrix-license-server
PORT=3000
```

## 🚀 Running Production Server

### Start Production Server
```bash
# Copy production config
cp .env.production .env

# Start server
node server_production.mjs
```

### Expected Output
```
🚀 PARAMETRIX License Server running on http://localhost:3000
📧 Email sender: support@mimevents.com
⏰ Trial duration: 7 days
🔐 JWT issuer: parametrix-license-server
```

## 📡 API Endpoints

### 1. Create Trial License
```http
POST /create-trial
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "device_id": "device_hash_here",
  "extension_name": "PARAMETRIX"
}
```

**Response (201):**
```json
{
  "jwt_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "license_key": "PAR-TRIAL-A1B2C3D4",
  "expires_at": "2024-01-31T12:00:00.000Z",
  "trial_days": 7
}
```

### 2. Validate License
```http
POST /validate-license
Content-Type: application/json

{
  "license_key": "PAR-TRIAL-A1B2C3D4",
  "device_id": "device_hash_here",
  "jwt_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." // optional
}
```

**Response (200):**
```json
{
  "jwt_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "license_key": "PAR-TRIAL-A1B2C3D4",
  "is_trial": true,
  "expires_at": "2024-01-31T12:00:00.000Z",
  "status": "active"
}
```

### 3. Revoke License
```http
POST /revoke-license
Content-Type: application/json

{
  "license_key": "PAR-TRIAL-A1B2C3D4",
  "reason": "User request"
}
```

### 4. Check License Status
```http
GET /license-status/PAR-TRIAL-A1B2C3D4
```

### 5. Health Check
```http
GET /health
```

## 🔒 Security Features

### JWT Security
- **RS256 algorithm** with RSA key pair
- **Public key verification** for token validation
- **Comprehensive payload** with all required claims
- **Expiration enforcement**

### License Security
- **Device binding** prevents license sharing
- **Email validation** prevents invalid registrations
- **Trial limits** prevent abuse
- **Status tracking** for audit trails

### Database Security
- **Parameterized queries** prevent SQL injection
- **Service role key** for secure Supabase access
- **Automatic status updates** for expired licenses

## 📊 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created (trial)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (JWT mismatch)
- `403` - Forbidden (revoked/suspended)
- `404` - Not Found (license not found)
- `409` - Conflict (trial already exists)
- `410` - Gone (license expired)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🔧 Customization

### Different Trial Durations
```bash
# 14-day trial
TRIAL_DURATION_DAYS=14

# 30-day trial
TRIAL_DURATION_DAYS=30
```

### Multiple Extensions
```bash
# Extension-specific config
EXTENSION_NAME=AUTONEST
PORT=3001
```

### Custom Email Templates
Modify `sendTrialEmail()` function in `server_production.mjs`

## 🚨 Production Checklist

- ✅ RSA key pair generated and secured
- ✅ Environment variables configured
- ✅ Supabase database schema updated
- ✅ Email service (Resend) configured
- ✅ Error handling implemented
- ✅ Security validations in place
- ✅ Logging configured
- ✅ Health check endpoint available

## 🔍 Monitoring

### Key Metrics to Monitor
- License creation rate
- Validation request frequency
- Error rates by endpoint
- Trial conversion rates
- Email delivery success

### Log Messages
- `[SUCCESS]` - Successful operations
- `[ERROR]` - Error conditions
- `[SERVER]` - Request logging

## 🛠️ Troubleshooting

### Common Issues
1. **JWT signing errors** - Check RSA private key format
2. **Email sending failures** - Verify Resend API key
3. **Database connection issues** - Check Supabase credentials
4. **Trial creation conflicts** - Check existing trial logic

### Debug Mode
Add detailed logging by setting:
```bash
NODE_ENV=development
```