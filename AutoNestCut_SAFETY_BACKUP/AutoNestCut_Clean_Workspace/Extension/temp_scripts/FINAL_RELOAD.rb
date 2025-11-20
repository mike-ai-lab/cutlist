Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('autonestcut') }
load "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/loader.rb"
puts "FINAL licensing system reloaded with fallbacks!"