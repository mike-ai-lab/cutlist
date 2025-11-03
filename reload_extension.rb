#!/usr/bin/env ruby
# AutoNestCut Extension Reloader
# Use this to quickly reload the extension during development
# This clears all cached versions and loads the latest code

puts "\n" + "=" * 60
puts "Reloading AutoNestCut Extension..."
puts "=" * 60

begin
  # Remove from loaded features to force reload - be aggressive with patterns
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') || f.include?('cutlist') }
  
  # Clear all AutoNestCut-related constants
  if defined?(AutoNestCut)
    Object.send(:remove_const, :AutoNestCut)
  end
  
  # Clear any cached extension references
  if defined?(Sketchup)
    # Get all loaded extensions and unload AutoNestCut if it exists
    Sketchup.extensions.each do |ext|
      if ext.name == "AutoNestCut"
        ext.unload if ext.respond_to?(:unload)
      end
    end
  end
  
  # Load the main loader which will properly register everything
  load File.join(__dir__, 'load_extension.rb')

  puts "\n✅ AutoNestCut extension reloaded successfully!"
  puts "=" * 60 + "\n"

rescue => e
  puts "\n❌ Error reloading extension: #{e.message}"
  puts e.backtrace.join("\n")
  puts "=" * 60 + "\n"
end
