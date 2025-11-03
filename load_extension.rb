#!/usr/bin/env ruby
# AutoNestCut Extension Loader
# This is the ONLY loader file to use for development and production
# It properly clears cache and loads the extension with all resources

require 'sketchup.rb'

# Clear any previously loaded versions to ensure fresh load
$LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') || f.include?('cutlist') }

# Clear constants to avoid warnings
if defined?(AutoNestCut)
  Object.send(:remove_const, :AutoNestCut)
end

# Get the absolute path to the extension
extension_root = File.join(__dir__, 'AutoNestCut', 'AutoNestCut')
main_file = File.join(extension_root, 'main.rb')

# Verify the main file exists
unless File.exist?(main_file)
  puts "ERROR: AutoNestCut main.rb not found at: #{main_file}"
  puts "Current directory: #{__dir__}"
  puts "Extension root: #{extension_root}"
  raise "AutoNestCut main.rb not found"
end

# Load the main extension file directly
load main_file

puts "=" * 60
puts "AutoNestCut Extension loaded successfully!"
puts "Main file: #{main_file}"
puts "=" * 60
