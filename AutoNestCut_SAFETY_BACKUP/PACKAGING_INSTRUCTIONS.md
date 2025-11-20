# AutoNestCut Extension Packaging Instructions

## SketchUp Extension Structure

This directory is organized following SketchUp best practices for extension distribution:

### Files for RBZ Package

**Include in RBZ:**
- `AutoNestCut.rb` - Main loader file (required)
- `AutoNestCut_Clean_Workspace/Extension/` - Complete extension folder
- `README.md` - Basic documentation

**Exclude from RBZ:**
- `DEVELOPMENT_FILES/` - Development artifacts and backups
- `PACKAGING_INSTRUCTIONS.md` - This file
- `.gitignore` - Git configuration

### Creating RBZ File

1. Select the following items:
   - `AutoNestCut.rb`
   - `AutoNestCut_Clean_Workspace/Extension/` (entire folder)
   - `README.md`

2. Create ZIP archive with these files
3. Rename ZIP extension to `.rbz`
4. The RBZ file is ready for distribution

### Security Notes

- The extension will be encrypted using rgloader before distribution
- Source code will be protected and obfuscated
- Only essential files are included in the final package
- Development files are safely isolated in DEVELOPMENT_FILES folder

### Installation Process

Users will:
1. Download the AutoNestCut.rbz file
2. Open SketchUp
3. Go to Window → Extension Manager
4. Click "Install Extension"
5. Select the RBZ file
6. Extension installs automatically

### File Structure in RBZ

```
AutoNestCut.rbz
├── AutoNestCut.rb (main loader)
├── AutoNestCut_Clean_Workspace/
│   └── Extension/
│       ├── loader.rb
│       ├── AutoNestCut/ (core extension files)
│       ├── lib/ (libraries)
│       └── vendor/ (dependencies)
└── README.md
```

This structure follows SketchUp extension standards and ensures proper loading and functionality.