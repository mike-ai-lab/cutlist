# Clear cached extension and reload latest version
begin
  # Remove from loaded features to force reload
  $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
  
  # Clear constants to avoid warnings
  if defined?(AutoNestCut)
    Object.send(:remove_const, :AutoNestCut)
  end
  
  # Load main file directly
  load 'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/main.rb'
  
  puts "AutoNestCut extension reloaded successfully!"
  
rescue => e
  puts "Error reloading extension: #{e.message}"
end