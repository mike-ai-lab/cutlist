# AutoNestCut Settings & Layout Fixes

## Issues Fixed

### 1. Settings Persistence Problem
**Problem**: Currency, units, precision settings were not automatically taking effect across the extension.

**Solution**:
- Added global settings (`default_currency`, `units`, `precision`) to the config system
- Added immediate backend synchronization when settings change
- Added `update_global_setting` method in Config module
- Added callback in dialog manager to handle settings updates
- Modified materials database to use global currency settings

**Files Modified**:
- `config.rb` - Added global settings support
- `app.js` - Added immediate backend sync for settings changes
- `dialog_manager.rb` - Added callback for global settings updates
- `config.html` - Added settings controls to the UI

### 2. Report Layout Problem
**Problem**: Multiple boards were loading horizontally instead of vertically in the report tab.

**Solution**:
- Changed diagrams container CSS from `flex-wrap: wrap` to `flex-direction: column`
- Updated diagram cards to take full width and not shrink
- Fixed both the main CSS file and exported HTML layout
- Ensured consistent vertical stacking of boards

**Files Modified**:
- `diagrams_style.css` - Fixed main report layout
- `diagrams_report.js` - Fixed exported HTML layout

## How the Fixes Work

### Settings Synchronization
1. When user changes currency/units/precision in UI
2. JavaScript immediately calls `updateGlobalSetting()` 
3. This triggers `callRuby('update_global_setting', ...)` 
4. Ruby backend updates the setting via `Config.update_global_setting()`
5. Setting is saved to SketchUp preferences and materials are updated

### Layout Fix
1. Diagrams container now uses `flex-direction: column`
2. Each diagram card takes full width (`width: 100%`)
3. Cards stack vertically with consistent spacing
4. Same layout applies to both UI and exported HTML

## Testing
1. Change currency in settings - should immediately update all material prices
2. Change units - should update all dimension labels
3. Change precision - should update number formatting
4. Generate report with multiple boards - should stack vertically
5. Export HTML - should maintain same vertical layout

## Benefits
- Settings changes take immediate effect
- Consistent currency/units across entire extension
- Better report readability with vertical board layout
- Exported HTML matches UI appearance