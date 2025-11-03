# Nesting Algorithm

This page explains the practical algorithm AutoNestCut uses for nesting sheet-good parts and lists common reasons for suboptimal results.

## Algorithm summary

AutoNestCut uses a deterministic greedy bin-packing approach:

1. Parts are normalized and sorted by area (largest first).
2. For each stock sheet, the algorithm attempts placements in available free rectangles.
3. Rotation is attempted when allowed and when grain constraints are not set.
4. If a part cannot be placed, the algorithm opens a new sheet and continues.
5. Final pass may perform small local adjustments to reduce obvious waste.

This approach is fast, predictable, and suitable for interactive use. It favors speed and consistent results over computationally expensive global optimizations.

## Common causes of poor nesting

- Parts with tight dimension constraints (fixed grain) reduce packing flexibility.
- Incorrect stock sizes or kerf set too large.
- Extremely small parts may fragment available space — consider grouping or using a separate process for hardware-sized parts.

## Practical tuning tips

- Allow rotation for less critical parts.
- Reduce kerf only to realistic values for your blade.
- Split very long, thin parts into a separate batch if they consistently fragment boards.
