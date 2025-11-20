# QUICK FIX - Run this to fix the constant issue
begin
  # Clear and reload properly
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  
  # Load main file directly
  load File.join(__dir__, 'AutoNestCut', 'main.rb')
  
  puts "✓ AutoNestCut fixed and loaded"
rescue => e
  puts "✗ Fix failed: #{e.message}"
end