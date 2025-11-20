# frozen_string_literal: true

require 'sketchup.rb'

# Check SketchUp version compatibility
if Sketchup.version.to_i < 20
  UI.messagebox("AutoNestCut requires SketchUp 2020 or later. Current version: #{Sketchup.version}")
  return
end

# Load licensing system first
begin
  require_relative '../lib/LicenseManager/license_manager'
  require_relative '../lib/LicenseManager/trial_manager'
  require_relative '../lib/LicenseManager/license_dialog'
  puts "Licensing system loaded successfully"
rescue LoadError => e
  puts "Warning: Could not load licensing system: #{e.message}"
end

# Core extension files
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

  # Define constants for the extension (good practice for registration)
  EXTENSION_NAME = 'Auto Nest Cut'.freeze
  EXTENSION_VERSION = '1.0.0'.freeze # Placeholder, update as needed
  EXTENSION_DESCRIPTION = 'Automated nesting and cut list generation for sheet goods.'.freeze
  EXTENSION_CREATOR = 'Muhamad Shkeir'.freeze # Assuming creator from email

  # Get the path to the current directory where this file resides
  PATH_ROOT = File.dirname(__FILE__).freeze

  def self.show_documentation
    html_file = File.join(__dir__, 'ui', 'html', 'documentation.html')

    if File.exist?(html_file)
      dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut Documentation",
        preferences_key: "AutoNestCut_Documentation",
        scrollable: true,
        resizable: true,
        width: 1000,
        height: 700,
        left: 100,
        top: 100,
        min_width: 800,
        min_height: 600,
        style: UI::HtmlDialog::STYLE_DIALOG
      )

      dialog.set_file(html_file)
      dialog.show
    else
      UI.messagebox("Documentation file not found at: #{html_file}")
    end
  end

  def self.open_purchase_page
    purchase_url = "https://autonestcutserver-moeshks-projects.vercel.app"
    UI.openURL(purchase_url)
  end

  # This method is the primary entry point for the extension's main functionality.
  # It's defined directly as a module method (`self.method_name`) for clarity and robustness.
  # Renamed from `activate_extension` to `run_extension_feature` to avoid confusion
  # with SketchUp's internal terminology for extension activation.
  def self.run_extension_feature
    # Check license before allowing extension use
    if defined?(AutoNestCut::LicenseManager)
      unless AutoNestCut::LicenseManager.has_valid_license?
        AutoNestCut::LicenseDialog.show_license_options
        return unless AutoNestCut::LicenseManager.has_valid_license?
      end

      # Start trial countdown if using trial license
      if defined?(AutoNestCut::TrialManager)
        AutoNestCut::TrialManager.start_trial_countdown
      end
    end

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

  def self.setup_ui
    unless file_loaded?("#{__FILE__}-ui")
      # Create main menu
      menu = UI.menu('Extensions')
      autonest_menu = menu.add_submenu(EXTENSION_NAME) # Use constant for name

      # Call the renamed primary function
      autonest_menu.add_item('Generate Cut List') { AutoNestCut.run_extension_feature }
      autonest_menu.add_separator
      autonest_menu.add_item('Documentation - How to...') { AutoNestCut.show_documentation }

      # Add license menu if licensing system is available
      if defined?(AutoNestCut::LicenseDialog)
        autonest_menu.add_separator
        autonest_menu.add_item('Purchase License') { AutoNestCut.open_purchase_page }
        autonest_menu.add_item('License Info') { AutoNestCut::LicenseDialog.show }
        autonest_menu.add_item('Trial Status') { AutoNestCut::LicenseDialog.show_trial_status }
      else
        puts "⚠️ LicenseDialog not defined"
      end

      # Create toolbar with icon
      toolbar = UI::Toolbar.new(EXTENSION_NAME) # Use constant for name
      # Call the renamed primary function
      cmd = UI::Command.new(EXTENSION_NAME) { AutoNestCut.run_extension_feature }
      cmd.tooltip = 'Generate optimized cut lists and nesting diagrams for sheet goods'
      cmd.status_bar_text = 'AutoNestCut - Automated nesting for sheet goods'

      # Set icons for toolbar
      icon_path = File.join(__dir__, 'resources', 'icon.png')
      if File.exist?(icon_path)
        cmd.small_icon = icon_path
        cmd.large_icon = icon_path
        puts "✅ AutoNestCut icon loaded: #{icon_path}"
      else
        puts "⚠️ AutoNestCut icon not found: #{icon_path}"
      end

      toolbar.add_item(cmd)
      toolbar.show

      file_loaded("#{__FILE__}-ui")
    end
  end

  # Module initialization
  unless defined?(@@loaded)
    @@loaded = true
    timestamp = Time.now.strftime("%H:%M:%S")
    puts "✅ AutoNestCut Module Loaded [#{timestamp}]"
    
    unless defined?(AutoNestCutPowerLoader)
      setup_ui
      
      if defined?(AutoNestCut::LicenseManager) && defined?(AutoNestCut::TrialManager)
        unless AutoNestCut::LicenseManager.has_valid_license?
          AutoNestCut::LicenseManager.check_existing_trial(false)
        end
        
        if AutoNestCut::TrialManager.trial_active?
          AutoNestCut::TrialManager.start_trial_countdown
        end
      end
    end
  end

end # End of module AutoNestCut
