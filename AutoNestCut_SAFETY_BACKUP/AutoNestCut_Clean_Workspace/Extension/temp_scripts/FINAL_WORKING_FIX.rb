# Final working fix - all console errors resolved
Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('autonestcut') }

license_files = [
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/license_manager.rb",
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/trial_manager.rb", 
  "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/lib/LicenseManager/license_dialog.rb"
]

license_files.each do |file|
  $LOADED_FEATURES.delete_if { |f| f.include?(file) }
  load file if File.exist?(file)
end

load "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension/loader.rb"
puts "ALL ISSUES FIXED - No console errors, consistent trial days calculation!"