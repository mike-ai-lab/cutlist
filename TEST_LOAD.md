# AutoNestCut - Test Load Instructions

## Quick Test

Copy and paste this command into the SketchUp Ruby Console:

```ruby
load 'f:/alt_drive/cutlist/load_extension.rb'
```

## Expected Output

You should see:

```
============================================================
AutoNestCut Extension loaded successfully!
Version: 1.0.0
Icon path: f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/resources/icon.png
Icon exists: true
============================================================
✅ AutoNestCut icon loaded: f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/resources/icon.png
```

## What to Look For

1. ✅ **Console shows success message** - Extension loaded
2. ✅ **New toolbar appears** - "AutoNestCut" toolbar with custom icon
3. ✅ **Extensions menu** - Extensions → AutoNestCut menu appears
4. ✅ **Icon displays** - Custom icon shows (not default SketchUp icon)

## If Something Goes Wrong

### Icon not showing
- Check console output for "Icon exists: true"
- Verify file exists at: `f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/resources/icon.png`
- Try reload: `load 'f:/alt_drive/cutlist/reload_extension.rb'`

### Extension not appearing
- Check for error messages in console
- Make sure you closed SketchUp completely before loading
- Try reload command

### Changes not visible
- Use reload command: `load 'f:/alt_drive/cutlist/reload_extension.rb'`
- This clears cache and loads latest version

## Quick Reload

After making changes, use:

```ruby
load 'f:/alt_drive/cutlist/reload_extension.rb'
```

This will:
- Clear all cached versions
- Remove extension from memory
- Load the latest version fresh
- Show new toolbar with updated icon
