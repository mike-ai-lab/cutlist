#!/usr/bin/env ruby
# AutoNestCut RBZ Package Creator
require 'zip'
require 'zip/filesystem'
require 'fileutils'

# Paths
EXTENSION_DIR = File.join(__dir__, 'AutoNestCut_Clean_Workspace', 'Extension')
OUTPUT_DIR = File.join(__dir__, 'AutoNestCut_Clean_Workspace', 'Served')
RBZ_FILE = File.join(OUTPUT_DIR, 'AutoNestCut.rbz')
LOADER_FILE = File.join(__dir__, 'AutoNestCut.rb')
README_FILE = File.join(__dir__, 'README.md')

puts "Creating AutoNestCut.rbz package..."

# Create output directory
FileUtils.mkdir_p(OUTPUT_DIR)

# Remove existing RBZ
File.delete(RBZ_FILE) if File.exist?(RBZ_FILE)

# Create RBZ package
Zip::File.open(RBZ_FILE, create: true) do |zipfile|
  
  # Add main loader file
  if File.exist?(LOADER_FILE)
    zipfile.add('AutoNestCut.rb', LOADER_FILE)
    puts "✓ Added AutoNestCut.rb"
  end
  
  # Add README
  if File.exist?(README_FILE)
    zipfile.add('README.md', README_FILE)
    puts "✓ Added README.md"
  end
  
  # Add extension directory recursively
  if Dir.exist?(EXTENSION_DIR)
    Dir.glob(File.join(EXTENSION_DIR, '**', '*')).each do |file|
      next if File.directory?(file)
      
      # Skip development files
      next if file.include?('DEV_FILES')
      next if file.include?('temp_scripts')
      next if file.end_with?('.log')
      
      # Calculate relative path
      relative_path = file.sub(File.dirname(EXTENSION_DIR) + '/', '')
      
      zipfile.add(relative_path, file)
    end
    puts "✓ Added Extension directory"
  end
end

puts "✅ AutoNestCut.rbz created successfully!"
puts "📦 Package location: #{RBZ_FILE}"
puts "📊 Package size: #{(File.size(RBZ_FILE) / 1024.0).round(2)} KB"