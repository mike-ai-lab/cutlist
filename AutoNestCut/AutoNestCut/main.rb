require 'sketchup.rb'
require_relative 'config'
require_relative 'models/part'
require_relative 'models/board'
require_relative 'processors/model_analyzer'
require_relative 'processors/nester'
require_relative 'ui/dialog_manager'
require_relative 'exporters/diagram_generator'
require_relative 'exporters/report_generator'
require_relative 'util'

module AutoNestCut
  
  def self.activate_extension
    model = Sketchup.active_model
    selection = model.selection
    
    if selection.empty?
      UI.messagebox("Please select components or groups to analyze.")
      return
    end
    
    begin
      # Extract parts from selection
      analyzer = ModelAnalyzer.new
      parts_by_material = analyzer.extract_parts_from_selection(selection)
      
      if parts_by_material.empty?
        UI.messagebox("No valid parts found in selection.")
        return
      end
      
      # Show configuration dialog
      dialog_manager = UIDialogManager.new
      dialog_manager.show_config_dialog(parts_by_material)
      
    rescue => e
      UI.messagebox("Error: #{e.message}")
    end
  end
  
  def self.process_nesting(parts_by_material, settings)
    begin
      # Perform nesting optimization
      nester = Nester.new
      boards = nester.optimize_boards(parts_by_material, settings)
      
      # Generate visual diagrams
      diagram_generator = DiagramGenerator.new
      diagram_generator.draw_diagrams(boards)
      
      # Generate and show report
      report_generator = ReportGenerator.new
      report_data = report_generator.generate_report_data(boards)
      
      dialog_manager = UIDialogManager.new
      dialog_manager.show_report_dialog(report_data, boards)
      
    rescue => e
      UI.messagebox("Error during nesting: #{e.message}")
    end
  end
  
  # Setup menu and toolbar
  unless file_loaded?(__FILE__)
    menu = UI.menu('Plugins')
    menu.add_item('AutoNestCut') { AutoNestCut.activate_extension }
    
    toolbar = UI::Toolbar.new('AutoNestCut')
    cmd = UI::Command.new('AutoNestCut') { AutoNestCut.activate_extension }
    cmd.tooltip = 'Generate optimized cut lists and nesting diagrams'
    cmd.status_bar_text = 'AutoNestCut - Automated nesting for sheet goods'
    toolbar.add_item(cmd)
    toolbar.show
    
    file_loaded(__FILE__)
  end
end