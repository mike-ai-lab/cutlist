# AutoNestCut Clean Workspace

This is your organized AutoNestCut development environment with extension and server components.

## 📁 Structure

```
AutoNestCut_Clean_Workspace/
├── Extension/                    # SketchUp Extension
│   ├── AutoNestCut/             # Main extension code
│   ├── lib/LicenseManager/      # Licensing system
│   ├── vendor/jwt/              # JWT authentication
│   ├── loader.rb                # Extension loader
│   ├── load_extension.rb        # Development loader
│   └── LOAD_EXTENSION.rb        # Complete loading script
└── Server/                      # License & Purchase Server
    ├── server.mjs               # Main server
    ├── admin-charcoal.html      # Admin dashboard
    ├── purchase-paypal.html     # Purchase page
    ├── .env                     # Environment variables
    └── test_server.js           # Server test script
```

## 🚀 Quick Start

### Extension Testing

1. **Open SketchUp**
2. **Open Ruby Console** (Window > Ruby Console)
3. **Copy and paste the entire content** of `Extension/LOAD_EXTENSION.rb`
4. **Press Enter** to execute
5. **Check for success messages** in console
6. **Use the extension** via Extensions > AutoNestCut menu

### Server Testing

1. **Navigate to Server directory**:
   ```bash
   cd Server
   ```

2. **Test server setup**:
   ```bash
   node test_server.js
   ```

3. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

4. **Start server**:
   ```bash
   node server.mjs
   ```

5. **Access server**:
   - Admin: http://localhost:3000/admin
   - Purchase: http://localhost:3000/purchase
   - Health Check: http://localhost:3000/health

## ✅ Testing Checklist

### Extension
- [ ] Extension loads without errors
- [ ] Menu appears in Extensions > AutoNestCut
- [ ] Toolbar icon appears
- [ ] License dialog works
- [ ] Main functionality accessible

### Server
- [ ] All required files present
- [ ] Environment variables configured
- [ ] Server starts without errors
- [ ] Admin dashboard accessible
- [ ] Purchase page loads
- [ ] Health check returns OK

## 🔧 Troubleshooting

### Extension Issues
- **Path errors**: Verify the path in LOAD_EXTENSION.rb matches your actual directory
- **Permission errors**: Run SketchUp as administrator
- **Cache issues**: The loader clears cache automatically

### Server Issues
- **Missing dependencies**: Run `npm install`
- **Environment variables**: Check `.env` file has all required variables
- **Port conflicts**: Change port in server.mjs if 3000 is in use

## 📝 Development Notes

- Extension source code is in `Extension/AutoNestCut/`
- Licensing system is in `Extension/lib/LicenseManager/`
- Server handles trials, purchases, and license validation
- All paths have been updated for the clean workspace structure

## 🎯 Next Steps

1. Test both extension and server
2. Verify licensing integration works
3. Once confirmed working, remove old scattered directories
4. Create external backup of this clean workspace