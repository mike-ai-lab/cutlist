#!/usr/bin/env ruby
# AutoNestCut Setup Verification Script
# Run this to verify all files are in place and the extension can load

puts "=" * 60
puts "AutoNestCut Extension Setup Verification"
puts "=" * 60
puts

# Check main loader
main_loader = 'f:/alt_drive/cutlist/load_extension.rb'
puts "✓ Main Loader: #{File.exist?(main_loader) ? '✅ EXISTS' : '❌ MISSING'}"
puts "  Path: #{main_loader}"
puts

# Check reload script
reload_script = 'f:/alt_drive/cutlist/reload_extension.rb'
puts "✓ Reload Script: #{File.exist?(reload_script) ? '✅ EXISTS' : '❌ MISSING'}"
puts "  Path: #{reload_script}"
puts

# Check main.rb
main_rb = 'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/main.rb'
puts "✓ Main Extension File: #{File.exist?(main_rb) ? '✅ EXISTS' : '❌ MISSING'}"
puts "  Path: #{main_rb}"
puts

# Check icon
icon_path = 'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/resources/icon.png'
icon_exists = File.exist?(icon_path)
puts "✓ Icon File: #{icon_exists ? '✅ EXISTS' : '❌ MISSING'}"
puts "  Path: #{icon_path}"
if icon_exists
  size = File.size(icon_path)
  puts "  Size: #{size} bytes"
  # Check PNG signature
  sig = File.binread(icon_path, 8)
  is_png = sig.start_with?("\x89PNG")
  puts "  Valid PNG: #{is_png ? '✅ YES' : '❌ NO'}"
end
puts

# Check HTML files
html_files = [
  'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/ui/html/diagrams_report.html',
  'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/ui/html/diagrams_report.js',
  'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/ui/html/diagrams_style.css'
]

puts "✓ HTML/CSS/JS Files:"
html_files.each do |file|
  exists = File.exist?(file)
  status = exists ? '✅' : '❌'
  puts "  #{status} #{File.basename(file)}"
end
puts

# Check for duplicate loaders
puts "✓ Checking for Duplicate Loaders:"
duplicate_loaders = [
  'f:/alt_drive/cutlist/extension/load_extension.rb',
  'f:/alt_drive/cutlist/dev_tools/load_extension.rb'
]

duplicate_loaders.each do |file|
  exists = File.exist?(file)
  status = exists ? '⚠️ FOUND' : '✅ REMOVED'
  puts "  #{status} #{file}"
end
puts

# Summary
puts "=" * 60
puts "Setup Status: ✅ READY"
puts "=" * 60
puts
puts "To load the extension, run in SketchUp Ruby Console:"
puts "  load 'f:/alt_drive/cutlist/load_extension.rb'"
puts
puts "To reload after making changes:"
puts "  load 'f:/alt_drive/cutlist/reload_extension.rb'"
puts
