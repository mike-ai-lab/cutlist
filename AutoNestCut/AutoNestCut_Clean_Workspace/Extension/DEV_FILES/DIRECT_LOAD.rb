# DIRECT LOAD - Bypass all caching
$LOADED_FEATURES.clear
Object.constants.each { |c| Object.send(:remove_const, c) if c.to_s.include?('AutoNestCut') rescue nil }
UI.close_all_dialogs rescue nil
GC.start

# Load files in order
require File.join(__dir__, 'AutoNestCut', 'compatibility.rb')
require File.join(__dir__, 'AutoNestCut', 'materials_database.rb')
require File.join(__dir__, 'AutoNestCut', 'config.rb')
require File.join(__dir__, 'AutoNestCut', 'models', 'part.rb')
require File.join(__dir__, 'AutoNestCut', 'models', 'board.rb')
require File.join(__dir__, 'AutoNestCut', 'processors', 'model_analyzer.rb')
require File.join(__dir__, 'AutoNestCut', 'processors', 'nester.rb')
require File.join(__dir__, 'AutoNestCut', 'ui', 'dialog_manager.rb')
require File.join(__dir__, 'AutoNestCut', 'exporters', 'diagram_generator.rb')
require File.join(__dir__, 'AutoNestCut', 'exporters', 'report_generator.rb')
require File.join(__dir__, 'AutoNestCut', 'util.rb')
require File.join(__dir__, 'AutoNestCut', 'main.rb')

puts "✓ AutoNestCut v2.1 DIRECT LOADED"