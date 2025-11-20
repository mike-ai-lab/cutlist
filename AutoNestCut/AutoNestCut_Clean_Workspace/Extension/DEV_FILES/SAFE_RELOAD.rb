# SAFE RELOAD - Preserves module structure while clearing caches
begin
  # Close dialogs first
  UI.close_all_dialogs rescue nil
  
  # Clear loaded files cache for AutoNestCut
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  
  # Touch files to break HTML cache
  Dir.glob(File.join(__dir__, 'AutoNestCut', '**', '*.{html,js,css}')).each do |file|
    File.utime(Time.now, Time.now, file) rescue nil
  end
  
  # Force GC
  GC.start
  
  # Reload main loader
  load File.join(__dir__, 'loader.rb')
  
  puts "✓ AutoNestCut safely reloaded"
rescue => e
  puts "✗ Safe reload failed: #{e.message}"
end