# AutoNestCut SketchUp Extension

AutoNestCut is a SketchUp extension that automates the process of generating optimized cutting diagrams and detailed cut lists from 3D SketchUp models, specifically designed for sheet goods (plywood, MDF, etc.).

## Features

- **Automatic Part Extraction**: Intelligently identifies sheet good components from your SketchUp model
- **Material Management**: Supports multiple materials with configurable stock sizes
- **Optimized Nesting**: Uses advanced algorithms to minimize waste and reduce material costs
- **Visual Diagrams**: Generates clear cutting diagrams directly in SketchUp
- **Detailed Reports**: Comprehensive cut lists with part dimensions, positions, and material usage
- **Export Options**: Export cut lists to CSV for use in spreadsheets

## Installation

1. Copy the entire `AutoNestCut` folder to your SketchUp Plugins directory:
   - Windows: `C:\Users\[username]\AppData\Roaming\SketchUp\SketchUp 20XX\SketchUp\Plugins\`
   - Mac: `~/Library/Application Support/SketchUp 20XX/SketchUp/Plugins/`

2. Restart SketchUp

3. The extension will appear in the Plugins menu and as a toolbar button

## Usage

### Basic Workflow

1. **Model Your Project**: Create your furniture or cabinet project in SketchUp using components for individual parts

2. **Select Components**: Select the groups or components you want to include in your cut list

3. **Launch AutoNestCut**: Click the AutoNestCut toolbar button or go to Plugins > AutoNestCut

4. **Configure Settings**: 
   - Set kerf width (saw blade thickness)
   - Configure stock material sizes
   - Choose nesting preferences

5. **Generate Cut List**: Click "Generate Cut List" to process your selection

6. **Review Results**: 
   - View the visual cutting diagrams in SketchUp
   - Review the detailed report with part lists and material usage
   - Export to CSV if needed

### Component Setup

For best results, follow these guidelines when modeling:

#### Material Assignment
You can assign materials to components in three ways:

1. **Custom Attributes** (Recommended):
   ```ruby
   component.set_attribute('AutoNestCut', 'Material', 'Plywood_19mm')
   ```

2. **Component Names**: Include material name in component name
   - Example: "Door_Plywood_19mm", "Shelf_MDF_16mm"

3. **Layers/Tags**: Place components on layers named after materials

#### Grain Direction
For parts that require specific grain orientation:
```ruby
component.set_attribute('AutoNestCut', 'GrainDirection', 'fixed')
```

### Stock Materials

Default materials included:
- Plywood_19mm: 2440mm × 1220mm
- Plywood_12mm: 2440mm × 1220mm  
- MDF_16mm: 2800mm × 2070mm
- MDF_19mm: 2800mm × 2070mm

You can add custom materials in the configuration dialog.

### Part Filtering

AutoNestCut automatically filters components to identify sheet goods:
- Thickness between 3mm and 50mm
- Minimum surface area of 100mm × 100mm
- Reasonable aspect ratios (not extremely long/thin parts)

## Configuration

### Settings File
Settings are stored in SketchUp's preferences and persist between sessions.

### Kerf Width
Set the kerf width to account for your saw blade thickness. This ensures proper spacing between parts in the nesting layout.

### Rotation
Enable/disable part rotation during nesting. Parts with fixed grain direction will not be rotated regardless of this setting.

## Output

### Visual Diagrams
- Creates a new SketchUp scene with cutting diagrams
- Each board shows nested parts with labels
- Color-coded parts for easy identification
- Waste areas clearly visible

### Cut List Report
- Complete parts list with dimensions and materials
- Board summary with efficiency calculations
- Overall project statistics
- Export to CSV for external use

## Troubleshooting

### No Parts Found
- Ensure selected components meet size criteria for sheet goods
- Check that components have proper dimensions (not zero-size)
- Verify components are not nested too deeply

### Poor Nesting Results
- Try adjusting kerf width
- Enable part rotation if grain direction allows
- Consider breaking large assemblies into individual components

### Dialog Issues
- Ensure SketchUp has proper permissions to create HTML dialogs
- Check that all HTML files are present in the ui/html folder

## Technical Details

### File Structure
```
AutoNestCut/
├── loader.rb                    # Extension entry point
├── AutoNestCut/
│   ├── main.rb                  # Main logic
│   ├── config.rb                # Settings management
│   ├── models/                  # Data models
│   ├── processors/              # Analysis and nesting
│   ├── ui/                      # User interface
│   ├── exporters/               # Report generation
│   └── util.rb                  # Utilities
└── resources/                   # Icons and assets
```

### Algorithm
Uses a greedy bin-packing algorithm with the following approach:
1. Sort parts by area (largest first)
2. For each material, attempt to place parts on current board
3. Try both orientations if rotation is allowed
4. Create new board when current board is full
5. Optimize for minimal waste

## License

Copyright 2024 AutoNestCut. All rights reserved.

## Support

For issues and feature requests, please contact the development team.

## Packaging / Publishing Notes

When preparing the extension for distribution (a `.rbz` or as a packaged plugin folder), follow these simple notes:

- Include a valid PNG icon inside the extension package at `AutoNestCut/AutoNestCut/resources/icon.png` (24×24 or 32×32 pixels recommended) so the toolbar shows the proper icon.
- The loader (`loader.rb`) uses a path relative to the `AutoNestCut` folder — keep the folder structure intact when packaging.
- Non-essential development artifacts (exported reports, console logs, dev scripts) can be kept outside the final package or in a separate `dev_tools/` or `extras/` folder.

If the toolbar icon does not appear after installing the extension, make sure a valid PNG exists in one of these locations (the extension checks these):

1. `AutoNestCut/AutoNestCut/resources/icon.png` (preferred)
2. `AutoNestCut/resources/icon.png` (legacy)
3. `../icon.png` (repository root — used only as a fallback during development)

Restart SketchUp after installing the extension to ensure the toolbar loads correctly.