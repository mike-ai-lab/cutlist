# Workflow

This section describes a practical, reliable workflow that produces the best results with AutoNestCut.

## Modeling tips

- Use components for every sheet-good part. Instances save memory and make reports concise.
- Name your components clearly (e.g., <code>Door_Plywood_19mm</code>), but rely on attributes for accuracy where possible.
- Apply SketchUp materials consistently to faces; AutoNestCut can use face materials to detect material type.

## Preparing materials and stock

- Open the materials (stock) dialog and ensure stock sheet sizes match your inventory. Add custom stock definitions as needed.

## Generating a nesting

1. Select components (or none to process the whole model).
2. Open AutoNestCut and review detected parts in the preview pane.
3. Set kerf and rotation preferences — prefer rotation when grain isn’t critical.
4. Run Generate and inspect the produced boards in the interactive report.

## Validate before cutting

- Use the material highlight feature to visually confirm assignments in SketchUp.
- Inspect part orientation and label placement in the diagrams.
- Export a CSV for shop inventory and a PDF for printing cutting diagrams.
