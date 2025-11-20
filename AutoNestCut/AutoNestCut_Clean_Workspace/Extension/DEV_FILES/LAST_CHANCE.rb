# LAST CHANCE - Nuclear option
begin
  # Kill everything
  ObjectSpace.each_object(Class) { |c| c.send(:remove_const, :AutoNestCut) if c.const_defined?(:AutoNestCut) rescue nil }
  $LOADED_FEATURES.clear
  GC.start
  
  # Direct file execution
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'compatibility.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'materials_database.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'config.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'util.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'models', 'part.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'models', 'board.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'processors', 'model_analyzer.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'processors', 'nester.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'exporters', 'diagram_generator.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'exporters', 'report_generator.rb')))
  eval(File.read(File.join(__dir__, 'AutoNestCut', 'ui', 'dialog_manager.rb')))
  
  # Create menu directly
  menu = UI.menu('Extensions').add_submenu('AutoNestCut v2.1 NUCLEAR')
  menu.add_item('Generate Cut List') do
    model = Sketchup.active_model
    selection = model.selection
    if selection.empty?
      UI.messagebox("Select components first")
    else
      analyzer = AutoNestCut::ModelAnalyzer.new
      parts = analyzer.extract_parts_from_selection(selection)
      if parts.empty?
        UI.messagebox("No sheet goods found")
      else
        dialog = AutoNestCut::UIDialogManager.new
        dialog.show_config_dialog(parts, analyzer.get_original_components_data, analyzer.get_hierarchy_tree)
      end
    end
  end
  
  puts "✓ NUCLEAR OPTION COMPLETE - IT BETTER WORK NOW!"
rescue => e
  puts "✗ NUCLEAR FAILED: #{e.message}"
end