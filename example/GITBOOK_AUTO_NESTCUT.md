# Introduction

This document explains how to get the most out of **AutoNestCut**, a SketchUp Extension. It is intentionally kept brief and GitBook-friendly so it can be directly uploaded and converted.

{% hint style="danger" %}
The present documentation is a work in progress and may change frequently. Translations may be added later.

**This document may describe features not yet released!**
{% endhint %}

{% hint style="success" %}
This documentation applies to **AutoNestCut Version 1.0.0 and higher**. Some features described here may not be available in older extension releases or on older SketchUp versions.
{% endhint %}

{% hint style="warning" %}
We assume that the reader is familiar with SketchUp basics (components, groups, materials, and the Ruby console when relevant).
{% endhint %}

## What is AutoNestCut?

**AutoNestCut** is a SketchUp extension that automates creation of optimized **cutting diagrams**, **cut lists**, and **project reports** for sheet goods (plywood, MDF, etc.). It extracts parts from your SketchUp model, groups them by material, and nests parts onto stock sheets to minimize waste while producing printable and interactive reports.

![Kitchen cabinet model example](kitchen_cabinets_model_showcase.JPG)

### A short demo (example)

{% embed url="https://www.youtube.com/watch?v=8f_R9Gzs4gU" %}

## Approach

To be useful across many projects AutoNestCut makes a few assumptions about parts and materials. It relies on component bounding boxes (or explicit attributes) to interpret the **length**, **width**, and **thickness** of parts. Material information is taken from SketchUp materials and augmented by extension attributes when available.

Processing differs by material type (for example, **Sheet Goods** versus **Solid Wood**). The extension is optimized for sheet goods nesting and cut list generation.

## Dimension and Orientation of Parts

AutoNestCut reads bounding boxes from SketchUp components (not groups by default) or from a selection of components. The extension can determine part dimensions using one of two approaches:

- automatic: the **greatest dimension** becomes the **length**, and the **smallest** becomes the **thickness**; or
- local axes: dimensions read from local axes (red = length, green = width, blue = thickness) when the modeler prefers explicit control.

Length/width/thickness behavior may be overridden per part using component attributes. Defining the front and back faces may be important when parts have direction-dependent finishes; AutoNestCut considers the positive side of the thickness axis as the front face.

## Material of Parts

By applying SketchUp materials to components (or by using component attributes that AutoNestCut recognizes) the extension finds the best matching stock sheet and computes parts lists and nesting layouts. For certain materials (sheet goods) cutting diagrams are computed and included in reports. Cost and material summaries are available when pricing is configured.

Further implementation details are available in the in-repo README and the extension's help pages.

## For the Impatient

A short FAQ and quick tips are included in the main README; video tutorials may be linked from within the extension UI. Example community resources can be added here as they become available.

## Key Features (short)

- Intelligent component detection (recursive search through model hierarchies)
- Material database with stock sizes and pricing
- Optimized nesting with kerf and rotation options
- Interactive HTML reports with 3D previews and printable PDF/CSV exports
- Visual diagrams with part labels and board numbering

![Cutting diagram example](diagram_example.JPG)

## Recommended Workflow (short)

1. Model each sheet-good part as an individual component.
2. Apply appropriate SketchUp materials and, if needed, component attributes for grain or fixed orientation.
3. Select the components you want to include (or leave nothing selected to process the whole model).
4. Launch AutoNestCut from the Extensions menu or toolbar.
5. Configure kerf, allowed rotation, and stock materials.
6. Generate the nesting and review the interactive report; export to CSV/PDF as needed.

## Export & Reports

AutoNestCut supports:

- PDF — print-ready diagrams and complete reports
- CSV — spreadsheet friendly part lists and material summaries
- Interactive HTML — self-contained reports with 3D viewers

The interactive report example is included in this repository as `AutoNestCut_Interactive_Report.html` and can be used as a sample shareable report.

## Troubleshooting (common issues)

- No parts found: ensure parts are components with realistic thickness and sufficient area.
- Poor nesting efficiency: allow rotation where grain permits and check kerf settings.
- Material detection errors: apply materials directly to components or use explicit attributes.

## Open Source & Credits

AutoNestCut is developed by the project maintainers and contributors. See the repository README for author and license details.

{% hint style="success" %}
If you'd like to suggest a better term, report an issue, or contribute a translation, please open an issue on the repository or use the contact method in the main README.
{% endhint %}

## Financial Contributions

If you find this tool useful and want to support continued development, consider sponsoring or donating using the project's preferred channels (see the repository README for details).
