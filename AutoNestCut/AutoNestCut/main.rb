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
      UI.messagebox("Please select components or groups to analyze for AutoNestCut.")
      return
    end

    begin
      analyzer = ModelAnalyzer.new
      part_types_by_material_and_quantities = analyzer.extract_parts_from_selection(selection)

      if part_types_by_material_and_quantities.empty?
        UI.messagebox("No valid sheet good parts found in your selection for AutoNestCut.")
        return
      end

      dialog_manager = UIDialogManager.new
      dialog_manager.show_config_dialog(part_types_by_material_and_quantities)

    rescue => e
      UI.messagebox("An error occurred during part extraction:\n#{e.message}")
    end
  end

  def self.process_nesting(part_types_by_material_and_quantities, settings)
    begin
      nester = Nester.new
      boards = nester.optimize_boards(part_types_by_material_and_quantities, settings)

      if boards.empty?
         UI.messagebox("No boards could be generated.")
         return
      end

      report_generator = ReportGenerator.new
      report_data = report_generator.generate_report_data(boards)

      dialog_manager = UIDialogManager.new
      dialog_manager.show_diagrams_and_report_dialog(boards, report_data)

    rescue => e
      UI.messagebox("An error occurred during the nesting process:\n#{e.message}")
    end
  end

  unless file_loaded?(__FILE__)
    menu = UI.menu('Plugins')
    menu.add_item('AutoNestCut') { AutoNestCut.activate_extension }

    toolbar = UI::Toolbar.new('AutoNestCut')
    cmd = UI::Command.new('AutoNestCut') { AutoNestCut.activate_extension }
    cmd.tooltip = 'Generate optimized cut lists and nesting diagrams for sheet goods'
    cmd.status_bar_text = 'AutoNestCut - Automated nesting for sheet goods'
    toolbar.add_item(cmd)
    toolbar.show

    file_loaded(__FILE__)
  end
end