# Troubleshooting

Common problems and pragmatic fixes when using AutoNestCut.

## No parts found

- Ensure parts are components (not loose geometry) and have a realistic thickness.
- Verify selection scope — if nothing is selected, AutoNestCut examines the entire model.

## Low nesting efficiency

- Allow rotation when grain is not critical.
- Check kerf and stock dimensions for typos.
- Break very long/thin parts into a separate processing batch.

## Material mismatches

- Use component attributes for explicit material assignment when automatic detection fails.
- Use the material highlight feature to visually confirm assignments.

## Dialog or UI issues

- Ensure SketchUp can open HTML dialogs and that the `ui/html` files are present (they are in `AutoNestCut/AutoNestCut/ui/html`).
