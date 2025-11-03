# Development helper to reload the extension in SketchUp (portable relative paths)
begin
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  if defined?(AutoNestCut)
    Object.send(:remove_const, :AutoNestCut)
  end
  load File.join(__dir__, 'AutoNestCut', 'AutoNestCut', 'main.rb')
  puts "AutoNestCut extension reloaded successfully!"
rescue => e
  puts "Error reloading extension: #{e.message}"
end
