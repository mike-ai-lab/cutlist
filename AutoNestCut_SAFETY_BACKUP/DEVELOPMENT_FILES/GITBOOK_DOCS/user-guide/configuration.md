# Configuration Settings

Detailed guide to configuring AutoNestCut for optimal performance and results.

---

## General Settings

**Kerf Width**
*   Definition: Thickness of material removed by cutting blade
*   Typical values: 2-4mm for circular saws, 1-2mm for laser cutting
*   Impact: Affects spacing between parts and material efficiency
*   Recommendation: Measure your actual blade thickness for accuracy

**Allow Rotation**
*   Purpose: Permits algorithm to rotate parts for better nesting
*   Benefits: Significantly improves material utilization
*   Considerations: Disable for parts with specific grain direction
*   Default: Enabled for maximum efficiency

**Part Labeling**
*   Options: Component names, custom labels, or sequential numbering
*   Format: Configurable prefix, suffix, and numbering schemes
*   Visibility: Control label size and positioning on diagrams
*   Export: Labels included in all output formats

**Measurement Units**
*   Supported: Millimeters, inches, centimeters
*   Consistency: Must match SketchUp model units
*   Precision: Configurable decimal places for measurements
*   Display: Affects all reports and export formats

## Material Configuration

**Stock Material Setup**
*   Name: Descriptive identifier (e.g., "Plywood_18mm_2440x1220")
*   Dimensions: Width and height in model units
*   Thickness: Material thickness for matching components
*   Price: Cost per sheet for accurate project costing

**Material Properties**
*   Grain Direction: Specify if parts must align with grain
*   Waste Factor: Percentage allowance for defects and handling
*   Minimum Cut Size: Smallest usable piece dimensions
*   Edge Banding: Additional material for edge treatment

**Material Categories**
*   Organization: Group similar materials for easier management
*   Filtering: Quick selection of material types
*   Defaults: Set preferred materials for common part types
*   Pricing: Category-based pricing rules and discounts

## Advanced Settings

**Nesting Algorithm**
*   Optimization Level: Balance between speed and efficiency
*   Iteration Count: Number of placement attempts per part
*   Spacing Rules: Minimum distances between parts
*   Edge Margins: Required clearance from sheet edges

**Performance Options**
*   Memory Limit: Maximum RAM usage for large projects
*   Processing Timeout: Maximum time for nesting calculations
*   Parallel Processing: Use multiple CPU cores when available
*   Cache Settings: Store intermediate results for faster re-processing

**Export Configuration**
*   File Naming: Templates for automatic file naming
*   Default Locations: Preferred save directories
*   Format Options: Quality settings for PDF and image exports
*   Metadata: Include project information in exported files

## Project Settings

**Default Information**
*   Company Name: Your business information
*   Contact Details: Phone, email, and address
*   Project Templates: Reusable project configurations
*   Branding: Logo and color scheme for reports

**Calculation Methods**
*   Costing Rules: How to calculate material and labor costs
*   Efficiency Metrics: Methods for measuring material utilization
*   Waste Calculations: How to account for unusable material
*   Reporting Standards: Consistent formatting across projects

## User Interface

**Dialog Preferences**
*   Window Sizes: Default dimensions for configuration dialogs
*   Tab Order: Preferred sequence for workflow tabs
*   Auto-Save: Automatic saving of configuration changes
*   Confirmation Dialogs: Control warning and confirmation messages

**Display Options**
*   Color Schemes: Visual themes for diagrams and reports
*   Font Sizes: Text scaling for different screen resolutions
*   Grid Settings: Background grid display in cutting diagrams
*   Zoom Levels: Default magnification for diagram viewing

## Configuration Management

**Saving Settings**
*   User Preferences: Personal settings saved per user account
*   Project Configurations: Settings specific to individual projects
*   Template Creation: Save configurations for reuse
*   Import/Export: Share settings between workstations

**Reset Options**
*   Factory Defaults: Restore original extension settings
*   Selective Reset: Reset specific setting categories
*   Backup/Restore: Save and restore custom configurations
*   Version Migration: Automatic updates for new extension versions

## Troubleshooting Configuration

**Common Issues**
*   Settings not saving: Check file permissions and disk space
*   Performance problems: Adjust memory and timeout settings
*   Incorrect measurements: Verify unit consistency
*   Missing materials: Check material database integrity

**Validation**
*   Setting Conflicts: Automatic detection of incompatible options
*   Range Checking: Ensure values are within acceptable limits
*   Dependency Validation: Verify related settings are compatible
*   Error Reporting: Clear messages for configuration problems

---

**Previous**: [Basic Workflow](workflow.md) | **Next**: [Material Management](materials.md)