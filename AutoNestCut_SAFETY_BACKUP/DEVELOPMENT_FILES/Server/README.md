# AutoNestCut License Server

Production-ready Node.js server for AutoNestCut extension licensing.

## Deployment

### Vercel
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `RESEND_API_KEY`
   - `SUPABASE_URL` 
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RSA_PRIVATE_KEY`
3. Deploy automatically

### Environment Variables Required
- `RESEND_API_KEY`: Email service API key
- `SUPABASE_URL`: Database URL
- `SUPABASE_SERVICE_ROLE_KEY`: Database service key
- `RSA_PRIVATE_KEY`: JWT signing key (PEM format)

## Endpoints
- `POST /create-trial`: Create new trial license
- `POST /check-trial`: Check existing trial
- `POST /validate-license`: Validate full license