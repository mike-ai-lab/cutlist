# Simple reload without complex logic
Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('autonestcut') }

# Load the extension
load "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/loader.rb"

# Test if classes are defined
puts "Classes after load:"
puts "AutoNestCut: #{defined?(AutoNestCut) ? 'YES' : 'NO'}"
puts "LicenseManager: #{defined?(AutoNestCut::LicenseManager) ? 'YES' : 'NO'}"
puts "LicenseDialog: #{defined?(AutoNestCut::LicenseDialog) ? 'YES' : 'NO'}"
puts "TrialManager: #{defined?(AutoNestCut::TrialManager) ? 'YES' : 'NO'}"

puts "Simple reload complete!"