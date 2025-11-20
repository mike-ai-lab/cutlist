# CLEAN LOAD - No licensing system
Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }

load File.join(__dir__, 'AutoNestCut', 'main_no_license.rb')

puts "✓ AutoNestCut v2.1 CLEAN LOADED - Try the extension now!"