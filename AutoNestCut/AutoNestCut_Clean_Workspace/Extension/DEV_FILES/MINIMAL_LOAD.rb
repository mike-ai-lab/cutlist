# MINIMAL LOAD - Skip licensing, load core only
Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)

# Load core files only
require_relative 'AutoNestCut/compatibility'
require_relative 'AutoNestCut/materials_database'
require_relative 'AutoNestCut/config'
require_relative 'AutoNestCut/models/part'
require_relative 'AutoNestCut/models/board'
require_relative 'AutoNestCut/processors/model_analyzer'
require_relative 'AutoNestCut/processors/nester'
require_relative 'AutoNestCut/ui/dialog_manager'
require_relative 'AutoNestCut/exporters/diagram_generator'
require_relative 'AutoNestCut/exporters/report_generator'
require_relative 'AutoNestCut/util'

module AutoNestCut
  def self.run_extension_feature
    model = Sketchup.active_model
    selection = model.selection

    if selection.empty?
      UI.messagebox("Please select components or groups to analyze for AutoNestCut.")
      return
    end

    begin
      analyzer = AutoNestCut::ModelAnalyzer.new
      part_types_by_material_and_quantities = analyzer.extract_parts_from_selection(selection)
      original_components = analyzer.get_original_components_data

      if part_types_by_material_and_quantities.empty?
        UI.messagebox("No valid sheet good parts found in your selection for AutoNestCut.")
        return
      end

      dialog_manager = AutoNestCut::UIDialogManager.new
      hierarchy_tree = analyzer.get_hierarchy_tree
      dialog_manager.show_config_dialog(part_types_by_material_and_quantities, original_components, hierarchy_tree)

    rescue => e
      UI.messagebox("An error occurred during part extraction:\n#{e.message}")
    end
  end

  # Setup UI
  menu = UI.menu('Extensions')
  autonest_menu = menu.add_submenu('AutoNestCut v2.1 [NEW FEATURES]')
  autonest_menu.add_item('Generate Cut List') { AutoNestCut.run_extension_feature }
  
  toolbar = UI::Toolbar.new('AutoNestCut v2.1')
  cmd = UI::Command.new('AutoNestCut v2.1') { AutoNestCut.run_extension_feature }
  cmd.tooltip = 'Generate optimized cut lists with NEW image export and clipboard features'
  toolbar.add_item(cmd)
  toolbar.show
end

puts "✓ AutoNestCut v2.1 MINIMAL LOADED - New features ready!"