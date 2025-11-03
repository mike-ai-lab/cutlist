# Materials & Stock

Managing stock materials correctly has a major impact on nesting efficiency and cost estimates.

## Stock material entries

Each stock material includes:
- Name (identifier)
- Width and height (sheet dimensions)
- Thickness
- Price per sheet (optional)

Example default materials are visible in the extension's config and can be customized to match local suppliers.

## How AutoNestCut detects materials

1. Component attributes (preferred when present)
2. Face materials applied to geometry
3. Component naming conventions (fallback)

## Visual verification

Use the material highlight control in the UI to toggle visibility for a chosen material. This helps you confirm that the parts assigned to a stock type are correct.

<img src="{{IMAGE_BASE}}/stock_materials_pricing.JPG" alt="Stock materials" onerror="this.onerror=null;this.src='../stock_materials_pricing.JPG'" style="max-width:100%;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,0.08)">
