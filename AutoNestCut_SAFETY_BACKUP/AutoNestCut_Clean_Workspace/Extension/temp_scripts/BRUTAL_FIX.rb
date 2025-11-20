Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('autonestcut') }

puts "🔥 BRUTAL RELOAD STARTING..."

# Force load licensing files directly
license_files = [
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/license_manager.rb",
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/trial_manager.rb",
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/license_dialog.rb"
]

license_files.each do |file|
  if File.exist?(file)
    load file
    puts "✅ LOADED: #{File.basename(file)}"
  else
    puts "❌ MISSING: #{File.basename(file)}"
  end
end

# Load main extension
load "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/loader.rb"

puts "🔥 CHECKING CLASSES:"
puts "AutoNestCut: #{defined?(AutoNestCut) ? '✅' : '❌'}"
puts "LicenseManager: #{defined?(AutoNestCut::LicenseManager) ? '✅' : '❌'}"
puts "LicenseDialog: #{defined?(AutoNestCut::LicenseDialog) ? '✅' : '❌'}"
puts "TrialManager: #{defined?(AutoNestCut::TrialManager) ? '✅' : '❌'}"

puts "🔥 BRUTAL RELOAD COMPLETE!"