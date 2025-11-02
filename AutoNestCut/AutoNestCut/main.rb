require 'sketchup.rb'

# Check SketchUp version compatibility
if Sketchup.version.to_i < 20
  UI.messagebox("AutoNestCut requires SketchUp 2020 or later. Current version: #{Sketchup.version}")
  return
end

require_relative 'compatibility'
require_relative 'materials_database'
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
      original_components = analyzer.get_original_components_data

      if part_types_by_material_and_quantities.empty?
        UI.messagebox("No valid sheet good parts found in your selection for AutoNestCut.")
        return
      end

      dialog_manager = UIDialogManager.new
      hierarchy_tree = analyzer.get_hierarchy_tree
      puts "Hierarchy tree from analyzer: #{hierarchy_tree.inspect}"
      dialog_manager.show_config_dialog(part_types_by_material_and_quantities, original_components, hierarchy_tree)

    rescue => e
      UI.messagebox("An error occurred during part extraction:\n#{e.message}")
    end
  end



  def self.show_documentation
    # Use HtmlDialog for SU2017+ or WebDialog for older versions
    if defined?(UI::HtmlDialog)
      dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut Documentation",
        preferences_key: "AutoNestCut_Documentation",
        scrollable: true,
        resizable: true,
        width: 1000,
        height: 700
      )
    else
      dialog = UI::WebDialog.new(
        "AutoNestCut Documentation",
        true,
        "AutoNestCut_Documentation",
        1000,
        700,
        100,
        100,
        true
      )
    end
    
    html_file = File.join(__dir__, 'ui', 'html', 'documentation.html')
    dialog.set_file(html_file)
    dialog.show
  end

  # Create main menu (allow recreation on reload)
  menu = UI.menu('Extensions')
  begin
    autonest_menu = menu.add_submenu('AutoNestCut')
  rescue
    # Submenu might already exist, get it
    autonest_menu = menu
  end
  
  autonest_menu.add_item('Generate Cut List') { AutoNestCut.activate_extension }
  autonest_menu.add_separator
  autonest_menu.add_item('Documentation - How to...') { AutoNestCut.show_documentation }

  # Create toolbar with icon
  unless file_loaded?(__FILE__)
    toolbar = UI::Toolbar.new('AutoNestCut')
    cmd = UI::Command.new('AutoNestCut') { AutoNestCut.activate_extension }
    cmd.tooltip = 'Generate optimized cut lists and nesting diagrams for sheet goods'
    cmd.status_bar_text = 'AutoNestCut - Automated nesting for sheet goods'
    
    # Cross-platform icon path
    icon_path = File.join(__dir__, 'resources', 'icon.png')
    if File.exist?(icon_path)
      cmd.small_icon = icon_path
      cmd.large_icon = icon_path
    end
    
    toolbar.add_item(cmd)
    toolbar.show

    file_loaded(__FILE__)
  end
end