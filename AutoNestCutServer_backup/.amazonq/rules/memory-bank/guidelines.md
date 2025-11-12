# AutoNestCut License Server - Development Guidelines

## Code Quality Standards

### File Structure and Naming
- Use descriptive filenames that reflect functionality (`server.js`, `server.mjs`, `server_production.mjs`)
- Separate development and production configurations (`.env` vs `.env.production`)
- Use `.mjs` extension for ES6 modules, `.js` for CommonJS legacy code
- Include comprehensive documentation files (`SETUP_DOCUMENTATION.md`, `PRODUCTION_GUIDE.md`)

### Code Formatting and Style
- Use consistent indentation (2 spaces observed in codebase)
- Place opening braces on same line as function/conditional declarations
- Use camelCase for variable names (`deviceId`, `userName`, `userEmail`)
- Use UPPER_SNAKE_CASE for environment variables and constants (`RESEND_API_KEY`, `SUPABASE_URL`)
- Include trailing commas in object literals and arrays for better diffs

### Error Handling Patterns
```javascript
// Standard try-catch with specific error responses
try {
  const { data, error } = await supabase.operation();
  if (error && error.code !== 'PGRST116') throw error;
} catch (error) {
  console.error(error);
  return res.status(500).json({ error: 'Server error' });
}
```

### Input Validation
```javascript
// Always validate required parameters
const { name, email, device_id } = req.body;
if (!name || !email || !device_id) {
  return res.status(400).json({ error: 'Missing name, email, or device_id' });
}
```

## Semantic Patterns and Architecture

### API Endpoint Design
- Use descriptive endpoint names that reflect actions (`/check-trial`, `/create-trial`)
- Follow RESTful conventions with appropriate HTTP methods (POST for data creation/modification)
- Return consistent JSON response structures with meaningful error messages
- Include status codes that match the response type (400 for validation, 409 for conflicts, 500 for server errors)

### Database Integration Patterns
```javascript
// Standard Supabase query pattern with error handling
const { data: existingTrial, error } = await supabase
  .from('licenses')
  .select('*')
  .eq('device_hash', device_id)
  .eq('is_trial', true)
  .eq('status', 'active')
  .single();

// Handle "no rows found" vs actual errors
if (error && error.code !== 'PGRST116') throw error;
```

### JWT Token Generation
```javascript
// Consistent JWT payload structure
const token = jwt.sign(
  {
    license_key: license.license_key,
    device_id: license.device_hash,
    is_trial: license.is_trial,
    exp: Math.floor(expiresAt.getTime() / 1000),
  },
  RSA_PRIVATE_KEY,
  { algorithm: 'RS256' }
);
```

### Asynchronous Operations
- Use async/await consistently throughout the codebase
- Handle email sending asynchronously without blocking main response
- Implement proper error logging with `console.error()` for debugging

### Date and Time Handling
```javascript
// Standard date calculation patterns
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
```

## Security and Best Practices

### Environment Configuration
- Store sensitive data in environment variables (API keys, database URLs, private keys)
- Use separate environment files for development and production
- Never commit sensitive credentials to version control
- Load environment variables using `dotenv.config()` at application startup

### Authentication and Authorization
- Use RSA256 algorithm for JWT signing with PEM-formatted private keys
- Include expiration timestamps in JWT payloads
- Validate device IDs to prevent unauthorized access
- Implement trial period limitations with proper expiration checks

### External API Integration
```javascript
// Standard external API call pattern with error handling
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error('API Error:', await response.text());
}
```

### License Key Generation
```javascript
// Consistent license key format with prefixes
const licenseKey = `PRM-TRIAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
```

## Development Workflow Standards

### Dependency Management
- Use exact version pinning in package.json for production stability
- Include both development and production dependency categories
- Maintain package-lock.json for reproducible builds
- Use modern package versions with security updates

### Server Configuration
- Use Express.js with standard middleware (CORS, JSON parsing)
- Configure CORS for cross-origin requests from SketchUp extension
- Set up proper port configuration (default 3000 for development)
- Include startup logging for server status confirmation

### Documentation Requirements
- Maintain comprehensive setup documentation with troubleshooting steps
- Include production deployment guides with specific configuration requirements
- Document API endpoints with request/response examples
- Provide clear error resolution steps for common issues

### Code Comments and Documentation
- Use inline comments for complex business logic
- Document API endpoint purposes and expected parameters
- Include error handling explanations for debugging
- Maintain clear function and variable naming to reduce comment necessity