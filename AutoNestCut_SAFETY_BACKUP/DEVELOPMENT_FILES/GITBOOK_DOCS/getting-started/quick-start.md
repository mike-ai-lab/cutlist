# Quick Start Guide

Get up and running with AutoNestCut in minutes. This guide walks through your first cut list generation.

---

## Basic Workflow Overview

AutoNestCut follows a simple five-step process:

1.  **Model Preparation** - Create components in SketchUp
2.  **Selection** - Choose components to analyze
3.  **Configuration** - Set materials and preferences
4.  **Generation** - Process nesting optimization
5.  **Export** - Save results in desired format

## Your First Cut List

### Step 1: Prepare Your Model

*   Create your furniture or project using SketchUp components
*   Ensure sheet good parts have realistic thickness (3-50mm)
*   Use consistent naming for similar parts
*   Group related components logically

### Step 2: Select Components

*   Select individual components or entire assemblies
*   Use Ctrl+click to select multiple non-adjacent components
*   Selected items will be analyzed for sheet good parts

> [!TIP]
> Select only the components you need to process for better performance with large models.

### Step 3: Launch AutoNestCut

*   Navigate to Extensions → AutoNestCut → Generate Cut List
*   Or click the AutoNestCut toolbar button
*   The configuration dialog will open

### Step 4: Configure Settings

**General Settings**
*   Set kerf width (typically 2-4mm for saw blade thickness)
*   Enable rotation if grain direction allows
*   Review detected parts in the preview

**Material Setup**
*   Add stock materials with dimensions and pricing
*   Assign materials to detected parts
*   Verify material properties are correct

### Step 5: Generate Report

*   Click "Generate Cut List" to start processing
*   Switch to the Report tab to view results
*   Review cutting diagrams and part lists
*   Add project information (name, date, notes)

### Step 6: Export Results

Choose your preferred export format:

*   **PDF** - For printing workshop diagrams
*   **CSV** - For spreadsheet analysis
*   **HTML** - For interactive sharing

## Example Project

**Kitchen Cabinet Door**

1.  Create a simple cabinet door (600mm × 400mm × 19mm)
2.  Make it a component named "Door_Panel"
3.  Select the component
4.  Launch AutoNestCut
5.  Set kerf to 3mm, add 2440×1220mm plywood sheet
6.  Generate cut list and review the single-part layout

## Next Steps

*   Explore [Configuration Settings](../user-guide/configuration.md) for advanced options
*   Learn about [Material Management](../user-guide/materials.md) for complex projects
*   Review [Understanding Reports](../user-guide/reports.md) for detailed analysis

---

**Previous**: [Installation](installation.md) | **Next**: [System Requirements](requirements.md)