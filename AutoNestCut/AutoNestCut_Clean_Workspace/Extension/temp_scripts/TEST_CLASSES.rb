Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('autonestcut') }
load "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/loader.rb"

puts "Testing class definitions:"
puts "AutoNestCut defined: #{defined?(AutoNestCut)}"
puts "LicenseManager defined: #{defined?(AutoNestCut::LicenseManager)}"
puts "LicenseDialog defined: #{defined?(AutoNestCut::LicenseDialog)}"
puts "TrialManager defined: #{defined?(AutoNestCut::TrialManager)}"