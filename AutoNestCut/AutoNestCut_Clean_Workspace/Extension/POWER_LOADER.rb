# AutoNestCut Extension Loader
require 'sketchup'

module AutoNestCutPowerLoader
  EXT_PATH = "C:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension"

  def self.cleanup
    # Remove all AutoNestCut constants
    Object.constants.grep(/AutoNestCut/).each do |const|
      Object.send(:remove_const, const) rescue nil
    end
    
    # Clear loaded features
    $LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') || f.include?('autonestcut') }
  end

  def self.load_extension
    main_file = File.join(EXT_PATH, "AutoNestCut", "main.rb")
    
    if File.exist?(main_file)
      load main_file
    end
  end

  def self.reload
    cleanup
    load_extension
  end
end

AutoNestCutPowerLoader.reload