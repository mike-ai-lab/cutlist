# AutoNestCut License Server - Project Structure

## Directory Structure

```
AutoNestCutServer/
├── .amazonq/                    # Amazon Q AI assistant configuration
│   └── rules/
│       └── memory-bank/         # Project documentation and guidelines
├── .qodo/                       # Qodo AI development tools
│   ├── agents/                  # AI agent configurations
│   └── workflows/               # Automated workflow definitions
├── .env                         # Development environment variables
├── .env.production             # Production environment configuration
├── package.json                # Node.js project dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── private_key.pem             # RSA private key for JWT signing
├── public_key.pem              # RSA public key for JWT verification
├── server.js                   # Legacy server implementation
├── server.mjs                  # Main ES6 module server (current)
├── server_production.mjs       # Production-optimized server version
├── PRODUCTION_GUIDE.md         # Production deployment instructions
├── SETUP_DOCUMENTATION.md      # Setup and troubleshooting guide
├── USER-workflow_summary.md    # User workflow documentation
└── resend_api-keys-*.csv       # Resend API key exports
```

## Core Components and Relationships

### Server Architecture
- **server.mjs**: Main application entry point using ES6 modules
- **server_production.mjs**: Production-ready version with optimizations
- **server.js**: Legacy CommonJS implementation (deprecated)

### Security Layer
- **private_key.pem**: RSA private key for JWT token signing
- **public_key.pem**: RSA public key for token verification
- **Environment files**: Secure configuration management

### Configuration Management
- **.env**: Development environment variables
- **.env.production**: Production environment settings
- **package.json**: Project metadata and dependencies

### Documentation Layer
- **SETUP_DOCUMENTATION.md**: Technical setup and troubleshooting
- **PRODUCTION_GUIDE.md**: Production deployment procedures
- **USER-workflow_summary.md**: User interaction workflows

## Architectural Patterns

### Microservice Architecture
- Single-purpose license server with focused responsibilities
- RESTful API design for client-server communication
- Stateless authentication using JWT tokens

### Security-First Design
- RSA cryptographic key management
- Environment-based configuration separation
- Secure database integration with service roles

### Cloud-Native Integration
- Supabase backend-as-a-service integration
- Resend API for email services
- Environment-based deployment configuration

### Development Workflow Integration
- AI-assisted development with Amazon Q and Qodo
- Automated workflow definitions
- Comprehensive documentation system

## Key Dependencies
- **express**: Web framework for API endpoints
- **jsonwebtoken**: JWT token generation and validation
- **@supabase/supabase-js**: Database integration
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **node-fetch**: HTTP client for external API calls