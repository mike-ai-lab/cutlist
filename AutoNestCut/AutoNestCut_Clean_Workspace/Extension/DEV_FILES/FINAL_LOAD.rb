# FINAL LOAD - Complete reload
Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)
$LOADED_FEATURES.delete_if { |f| f.include?('AutoNestCut') }
load File.join(__dir__, 'AutoNestCut', 'main.rb')
puts "✓ AutoNestCut v2.1 FINAL LOADED - Try the menu now"