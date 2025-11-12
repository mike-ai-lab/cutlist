# AutoNestCut License Server - Technology Stack

## Programming Languages and Versions

### JavaScript (ES6+)
- **Primary Language**: Modern JavaScript with ES6 modules
- **Runtime**: Node.js (latest LTS recommended)
- **Module System**: ES6 imports/exports (.mjs files)
- **Legacy Support**: CommonJS modules (.js files) for compatibility

## Build Systems and Dependencies

### Package Management
- **npm**: Node Package Manager for dependency management
- **package.json**: Project configuration and dependency definitions
- **package-lock.json**: Locked dependency versions for reproducible builds

### Core Dependencies
```json
{
  "@supabase/supabase-js": "^2.78.0",    // Database client
  "cors": "^2.8.5",                      // Cross-origin resource sharing
  "dotenv": "^17.2.3",                   // Environment variable loading
  "express": "^5.1.0",                   // Web framework
  "jsonwebtoken": "^9.0.2",              // JWT token handling
  "node-fetch": "^3.3.2"                 // HTTP client
}
```

## Development Commands

### Installation
```bash
npm install                    # Install all dependencies
```

### Server Execution
```bash
node server.mjs               # Start development server
node server_production.mjs    # Start production server
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# Required: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

## Technology Stack Details

### Backend Framework
- **Express.js 5.x**: Modern web framework with async/await support
- **RESTful API**: Standard HTTP methods for client communication
- **Middleware**: CORS, JSON parsing, error handling

### Authentication & Security
- **JWT (JSON Web Tokens)**: Stateless authentication
- **RSA256 Algorithm**: Asymmetric cryptographic signing
- **PEM Key Files**: Standard format for RSA key storage
- **Environment Variables**: Secure configuration management

### Database Integration
- **Supabase**: PostgreSQL-based backend-as-a-service
- **Service Role**: Server-side database authentication
- **Real-time**: WebSocket support for live updates

### External Services
- **Resend API**: Transactional email service
- **HTTPS**: Secure communication protocols
- **CORS**: Cross-origin request handling

### Development Tools
- **Amazon Q**: AI-powered development assistance
- **Qodo**: Automated code analysis and workflows
- **Git**: Version control system
- **Environment Files**: Development/production configuration separation

## File System Requirements

### Key Files
- `private_key.pem`: RSA private key (2048-bit minimum)
- `public_key.pem`: RSA public key (optional, for verification)
- `.env`: Environment variables (development)
- `.env.production`: Production environment configuration

### Directory Permissions
- Read access: All application files
- Write access: Log files (if implemented)
- Secure storage: Private key files (restricted access)

## Deployment Considerations

### Production Environment
- Node.js LTS version
- Process manager (PM2 recommended)
- Reverse proxy (Nginx/Apache)
- SSL/TLS certificates
- Environment variable security
- Log rotation and monitoring