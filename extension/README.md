# AutoNestCut - Extension Folder

This folder contains helper wrapper scripts and documentation to make the extension package layout clearer during development.

Purpose
- Provide an explicit `extension/` folder that developers can use to quickly load or reload the extension during development.
- These are wrappers only — the actual extension source remains in `AutoNestCut/` and is not moved.

Files
- `load_extension.rb` — wrapper that loads the real loader at `../AutoNestCut/loader.rb`.
- `reload_extension.rb` — wrapper that forces reload of the main extension file for quick development.

Usage
1. From the SketchUp Ruby Console or your development flow, run:
   ```ruby
   load File.join(__dir__, 'extension', 'load_extension.rb')
   ```
   or use the Extension Manager to point to these files while developing.

Notes
- These wrappers keep the original code intact and avoid moving files, which helps keep packaging and distribution stable.
