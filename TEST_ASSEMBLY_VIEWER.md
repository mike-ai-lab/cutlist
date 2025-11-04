# Assembly Viewer - Quick Test Instructions

## Files Updated

✅ **assembly_viewer.html** - Created (3D viewer UI)
✅ **assembly_viewer.js** - Created (3D viewer logic)
✅ **diagrams_report.html** - Updated (added "3D Assembly" button)
✅ **diagrams_report.js** - Updated (added button handler)
✅ **dialog_manager.rb** - Updated (added viewer window creation)
✅ **load_extension.rb** - Updated (cache clearing)

## How to Test

### Step 1: Reload Extension
In SketchUp Ruby Console, run:
```ruby
load 'C:/Users/Administrator/Desktop/AUTOMATION/cutlist/reload_extension.rb'
```

### Step 2: Generate a Report
1. Select components in SketchUp
2. Click **Extensions → AutoNestCut → Generate Cut List**
3. Configure materials and click **Process**

### Step 3: Look for "3D Assembly" Button
In the report dialog, you should see a new button in the header:
- **Icon**: 🔧
- **Label**: 3D Assembly
- **Position**: First button in the top-right section

### Step 4: Click the Button
Click the "3D Assembly" button to open the 3D viewer window.

### Step 5: Verify 3D Viewer
The viewer should show:
- All components from your assembly
- Interactive 3D scene with orbit/pan/zoom
- Component list on the right sidebar
- Assembly statistics (bounds, component count, materials)

## Expected Behavior

✅ Button appears in report dialog header
✅ Clicking button opens new window
✅ 3D scene loads with all components
✅ Components are positioned correctly
✅ Can orbit, pan, and zoom
✅ Can click components to select them
✅ Component list shows all parts
✅ Assembly statistics display correctly

## If Button Doesn't Appear

1. **Close SketchUp completely**
2. **Reopen SketchUp**
3. **Reload extension**: `load 'C:/Users/Administrator/Desktop/AUTOMATION/cutlist/reload_extension.rb'`
4. **Generate new report**

This clears SketchUp's HTML cache completely.

## If 3D Viewer Doesn't Open

Check SketchUp Ruby Console for errors:
- Look for error messages
- Check if assembly_viewer.html file exists
- Verify file paths are correct

## Success Indicators

✅ "3D Assembly" button visible in report
✅ New window opens when clicked
✅ 3D scene renders with components
✅ Can interact with the assembly
✅ Component list populates
✅ Statistics display correctly

---

**Status**: Ready for Testing
**Date**: November 3, 2025
