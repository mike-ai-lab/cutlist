# CLEAR CACHE SCRIPT - Run before any development changes
# This ensures fresh loading of all files

# Remove all AutoNestCut modules and classes
ObjectSpace.each_object(Module) do |mod|
  if mod.name && mod.name.include?('AutoNestCut')
    begin
      Object.send(:remove_const, mod.name.split('::').last) if Object.const_defined?(mod.name.split('::').last)
    rescue
    end
  end
end

# Clear require cache
$LOADED_FEATURES.reject! { |f| f.match(/AutoNestCut/i) }

# Clear method cache
if defined?(RubyVM) && RubyVM.respond_to?(:stat)
  RubyVM.stat[:global_method_state] = 0 rescue nil
end

# Force file timestamp updates to bypass HTML cache
html_files = Dir.glob(File.join(__dir__, '**', '*.{html,js,css,rb}'))
html_files.each do |file|
  begin
    current_time = Time.now
    File.utime(current_time, current_time, file)
  rescue
  end
end

# Clear SketchUp's internal caches
Sketchup.send_action('selectSelectionTool:') rescue nil

puts "All caches cleared - ready for fresh reload"