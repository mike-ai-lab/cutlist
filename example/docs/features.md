# Features

AutoNestCut focuses on delivering practical features that solve real workshop problems. Below is a compact but actionable list of the key capabilities.

## Intelligent Part Detection

- Recursive component scanning that finds parts inside assemblies.
- Filters to ignore tiny geometry or parts outside defined thickness ranges.

## Material Management

- Stock materials database (size, thickness, price).
- Automatic detection from component materials, face materials, or explicit attributes.
- Visual highlighting in the UI to verify assignments before nesting.

## Nesting & Optimization

- Greedy bin-packing algorithm optimized for sheet goods.
- Kerf compensation and optional part rotation (respecting grain constraints).
- Board-level efficiency metrics and visual waste reporting.

## Reporting & Exports

- Interactive HTML reports with 3D previews and part highlighting.
- PDF and CSV exports for workshop use and inventory systems.

## Developer & Packaging Notes

The repo includes a small `extension/` folder with development wrappers used during development — these are *helpers* and not required for end-user installation. When packaging for distribution keep the main `AutoNestCut/` folder intact.
