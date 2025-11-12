# Development Loader - Hot Reload for AutoNestCut
# Run this in Ruby Console to reload without restarting SketchUp

# Clear all AutoNestCut constants and modules
Object.constants.grep(/AutoNestCut/).each do |const|
  Object.send(:remove_const, const) if Object.const_defined?(const)
end

# Remove all loaded files from this extension
$LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }

# Clear any existing menus/toolbars
begin
  UI.menu('Plugins').get_item('AutoNestCut: License Info').remove if UI.menu('Plugins').get_item('AutoNestCut: License Info')
rescue
end

# Clear status
Sketchup.status_text = ""

# Force reload the main loader
load File.join(__dir__, 'loader.rb')

puts "AutoNestCut reloaded successfully!"