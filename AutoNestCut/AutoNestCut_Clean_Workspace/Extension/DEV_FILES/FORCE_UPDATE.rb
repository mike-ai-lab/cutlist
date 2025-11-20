# FORCE UPDATE - Forces complete cache clear and reload
begin
  # Close all dialogs
  UI.close_all_dialogs rescue nil
  
  # Clear constants
  Object.constants.select { |c| c.to_s.include?('AutoNestCut') }.each do |const|
    Object.send(:remove_const, const) rescue nil
  end
  
  # Clear loaded files
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  
  # Update all file timestamps
  Dir.glob(File.join(__dir__, 'AutoNestCut', '**', '*')).each do |file|
    File.utime(Time.now + rand(100), Time.now + rand(100), file) if File.file?(file)
  end
  
  # Force GC
  GC.start
  
  # Wait and reload
  sleep(0.5)
  load File.join(__dir__, 'loader.rb')
  
  puts "✓ FORCED UPDATE COMPLETE - v2.1 with Images & Clipboard features loaded"
rescue => e
  puts "✗ Force update failed: #{e.message}"
end