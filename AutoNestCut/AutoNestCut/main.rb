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
  # Define all methods first
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
      Util.debug("Hierarchy tree from analyzer: #{hierarchy_tree.inspect}")
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

  def self.setup_ui
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

    # Create toolbar with icon (recreate on each load for fresh icon)
    toolbar = UI::Toolbar.new('AutoNestCut')
    cmd = UI::Command.new('AutoNestCut') { AutoNestCut.activate_extension }
    cmd.tooltip = 'Generate optimized cut lists and nesting diagrams for sheet goods'
    cmd.status_bar_text = 'AutoNestCut - Automated nesting for sheet goods'
    
    # Cross-platform icon lookup with a few sensible fallbacks.
    # Prefer a resources/icon.png located alongside this file, then the parent AutoNestCut/resources,
    # then the repository root icon.png. Also verify the file is a PNG by checking the signature.
    possible_icon_paths = [
      File.join(__dir__, 'resources', 'icon.png'),
      File.expand_path('../resources/icon.png', __dir__),
      File.expand_path('../../icon.png', __dir__)
    ]

    chosen_icon = possible_icon_paths.find { |p| Util.png_file?(p) }
    if chosen_icon
      cmd.small_icon = chosen_icon
      cmd.large_icon = chosen_icon
      puts "✅ AutoNestCut icon loaded: #{chosen_icon}"
    else
      puts "⚠️ AutoNestCut: no valid icon found. Looked in: #{possible_icon_paths.join(', ')}"
    end
    
    toolbar.add_item(cmd)
    toolbar.show
  end

end

# Setup UI after module is fully defined
# Call setup_ui to initialize menus and toolbar
AutoNestCut.setup_ui

# Mark as loaded for SketchUp
unless file_loaded?(__FILE__)
  file_loaded(__FILE__)
end
