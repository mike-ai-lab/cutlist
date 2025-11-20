# POWER LOADER - Simple Extension Loader
require 'sketchup'

module AutoNestCutPowerLoader
  EXT_PATH = "C:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension"

  def self.cleanup
    puts "🔥 POWER LOADER - CLEANUP INITIATED"
    
    # Remove all AutoNestCut constants
    Object.constants.grep(/AutoNestCut/).each do |const|
      Object.send(:remove_const, const) rescue nil
      puts "   ❌ Removed constant: #{const}"
    end
    
    # Clear loaded features
    removed_features = $LOADED_FEATURES.select { |f| f.include?('AutoNestCut') || f.include?('autonestcut') }
    $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') || f.include?('autonestcut') }
    puts "   🗑️  Cleared #{removed_features.size} loaded features"
    
    puts "🧹 CLEANUP COMPLETE"
  end

  def self.load_extension
    puts "🚀 LOADING AutoNestCut"
    
    main_file = File.join(EXT_PATH, "AutoNestCut", "main.rb")
    
    if File.exist?(main_file)
      load main_file
      puts "✅ LOADED SUCCESSFULLY"
    else
      puts "❌ MAIN FILE NOT FOUND: #{main_file}"
    end
  end

  def self.reload
    cleanup
    load_extension
  end
end

puts "🔥 POWER LOADER INITIALIZED"
AutoNestCutPowerLoader.reload
puts "🚀 POWER LOADER READY"