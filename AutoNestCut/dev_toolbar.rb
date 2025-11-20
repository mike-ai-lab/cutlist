# Development Toolbar for AutoNestCut
require 'sketchup'

unless file_loaded?(__FILE__)
  toolbar = UI::Toolbar.new("AutoNestCut Dev")
  
  cmd = UI::Command.new("Reload Extension") do
    load "C:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/POWER_LOADER.rb"
  end
  
  cmd.tooltip = "Reload AutoNestCut Extension"
  cmd.status_bar_text = "Click to reload AutoNestCut using PowerLoader"
  
  toolbar.add_item(cmd)
  toolbar.show
  
  file_loaded(__FILE__)
end