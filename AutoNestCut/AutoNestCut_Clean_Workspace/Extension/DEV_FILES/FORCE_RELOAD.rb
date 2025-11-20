# FORCE RELOAD SCRIPT - Clear all caches and reload extension
# Run this script in SketchUp Ruby Console to force complete reload

# Clear all AutoNestCut related constants and modules
Object.constants.grep(/AutoNestCut/).each do |const|
  Object.send(:remove_const, const) if Object.const_defined?(const)
end

# Clear loaded files cache
$LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }

# Close any open dialogs
begin
  Sketchup.active_model.close_active if Sketchup.active_model.respond_to?(:close_active)
rescue
end

# Clear UI dialogs
UI.close_all_dialogs if UI.respond_to?(:close_all_dialogs)

# Force garbage collection
GC.start

# Clear HTML cache by touching files
Dir.glob(File.join(__dir__, '**', '*.html')).each do |file|
  File.utime(Time.now, Time.now, file)
end

Dir.glob(File.join(__dir__, '**', '*.js')).each do |file|
  File.utime(Time.now, Time.now, file)
end

Dir.glob(File.join(__dir__, '**', '*.css')).each do |file|
  File.utime(Time.now, Time.now, file)
end

# Reload the extension
load File.join(__dir__, 'loader.rb')

puts "AutoNestCut extension force reloaded with cleared caches"