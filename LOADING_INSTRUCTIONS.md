# AutoNestCut Extension - Loading Instructions

## ⚠️ IMPORTANT: Use ONLY ONE Loader

There is now **ONE SINGLE LOADER** file to use:

```
f:/alt_drive/cutlist/load_extension.rb
```

## How to Load the Extension

### Method 1: From SketchUp Ruby Console (Recommended for Development)

1. **Close SketchUp completely** (important to clear cache)
2. **Open SketchUp fresh**
3. **Open Ruby Console**: Window → Ruby Console
4. **Paste and run this command:**

```ruby
load 'f:/alt_drive/cutlist/load_extension.rb'
```

5. **You should see output like:**
```
AutoNestCut Extension loaded successfully!
Version: 1.0.0
Icon path: f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/resources/icon.png
Icon exists: true
```

### Method 2: Quick Reload During Development

If you've already loaded the extension and made changes, use:

```ruby
load 'f:/alt_drive/cutlist/reload_extension.rb'
```

This will:
- Clear all cached versions
- Remove the extension from memory
- Load the latest version fresh
- Show the updated toolbar with new icon

## What Gets Loaded

The loader automatically:
- ✅ Clears any previously cached versions
- ✅ Loads the extension with proper SketchUp registration
- ✅ Finds and sets the custom icon (icon.png)
- ✅ Creates the toolbar with the icon
- ✅ Creates the Extensions menu
- ✅ Loads all updated HTML/CSS/JS files

## Verifying the Extension Loaded

After running the load command, you should see:

1. **New Toolbar**: A toolbar named "AutoNestCut" with the custom icon appears
2. **Extensions Menu**: Extensions → AutoNestCut menu with options:
   - Generate Cut List
   - Documentation - How to...
3. **Console Output**: Success message with icon path confirmation

## If the Icon Doesn't Show

The icon should be at:
```
f:\alt_drive\cutlist\AutoNestCut\AutoNestCut\resources\icon.png
```

If it's not showing:
1. Verify the file exists at that path
2. Run the reload command: `load 'f:/alt_drive/cutlist/reload_extension.rb'`
3. Check the console output for the icon path and "Icon exists: true"

## Troubleshooting

### Extension doesn't appear
- Make sure you closed SketchUp completely before loading
- Check the Ruby Console for error messages
- Try the reload command

### Icon still shows as default SketchUp icon
- Verify icon.png exists at the correct path
- Run reload command
- Check console output shows "Icon exists: true"

### Changes not showing up
- Use the reload command: `load 'f:/alt_drive/cutlist/reload_extension.rb'`
- This clears all cache and loads the latest version

## File Structure

```
f:/alt_drive/cutlist/
├── load_extension.rb          ← USE THIS ONE (main loader)
├── reload_extension.rb        ← Use for quick reload
├── AutoNestCut/
│   ├── loader.rb              (legacy, not used directly)
│   └── AutoNestCut/
│       ├── main.rb            (extension entry point)
│       ├── resources/
│       │   └── icon.png       (toolbar icon)
│       └── ui/html/
│           ├── diagrams_report.html
│           ├── diagrams_report.js
│           └── diagrams_style.css
└── dev_tools/
    └── load_extension.rb      (redirects to main loader)
```

## Notes

- The main loader at `f:/alt_drive/cutlist/load_extension.rb` is the ONLY one you need
- All other loaders have been consolidated or deprecated
- The loader automatically finds and loads the icon
- Cache is cleared on each load to ensure you get the latest version
