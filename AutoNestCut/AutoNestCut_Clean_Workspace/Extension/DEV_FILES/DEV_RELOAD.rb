# DEVELOPMENT RELOAD - Use this during development
# Copy and paste this entire script into SketchUp Ruby Console

begin
  # 1. Clear all AutoNestCut constants
  Object.constants.select { |c| c.to_s.include?('AutoNestCut') }.each do |const|
    Object.send(:remove_const, const) rescue nil
  end
  
  # 2. Clear loaded files
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  
  # 3. Close dialogs
  begin
    if defined?(UI) && UI.respond_to?(:close_all_dialogs)
      UI.close_all_dialogs
    end
  rescue
  end
  
  # 4. Force GC
  GC.start
  
  # 5. Touch all files to break cache
  base_path = File.join(File.dirname(__FILE__), 'AutoNestCut')
  Dir.glob(File.join(base_path, '**', '*')).each do |file|
    File.utime(Time.now, Time.now, file) if File.file?(file)
  end
  
  # 6. Reload
  load File.join(File.dirname(__FILE__), 'loader.rb')
  
  puts "✓ AutoNestCut reloaded successfully"
rescue => e
  puts "✗ Reload failed: #{e.message}"
end