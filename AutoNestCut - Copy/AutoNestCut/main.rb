require 'sketchup.rb'

# Check SketchUp version compatibility
if Sketchup.version.to_i < 20
  UI.messagebox("AutoNestCut requires SketchUp 2020 or later. Current version: #{Sketchup.version}")
  return
end

# Load licensing system first
begin
  require_relative '../lib/AutoNestCut/license_manager'
  require_relative '../lib/AutoNestCut/trial_manager'
  require_relative '../lib/AutoNestCut/license_dialog'
rescue LoadError => e
  puts "Warning: Could not load licensing system: #{e.message}"
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
  class << self
    def activate_extension
      # Check license before allowing extension use
      if defined?(AutoNestCut::LicenseManager)
        unless AutoNestCut::LicenseManager.has_valid_license?
          AutoNestCut::LicenseManager.show_license_options
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

    def show_documentation
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

    def open_purchase_page
      # Try to open in SketchUp dialog first, fallback to browser
      begin
        if defined?(UI::HtmlDialog)
          dialog = UI::HtmlDialog.new(
            dialog_title: "AutoNestCut - Purchase License",
            preferences_key: "AutoNestCut_Purchase",
            scrollable: true,
            resizable: true,
            width: 900,
            height: 700
          )
          html_file = File.join(__dir__, 'ui', 'html', 'purchase.html')
          dialog.set_file(html_file)
          dialog.show
        else
          # Fallback to browser for older SketchUp versions
          purchase_url = "https://autonestcutserver-3srrv5rok-moeshks-projects.vercel.app/purchase"
          UI.openURL(purchase_url)
        end
      rescue => e
        # If dialog fails, open in browser
        purchase_url = "https://autonestcutserver-3srrv5rok-moeshks-projects.vercel.app/purchase"
        UI.openURL(purchase_url)
      end
    end

    def setup_ui
      unless file_loaded?("#{__FILE__}-ui")
        # Create main menu
        menu = UI.menu('Extensions')
        autonest_menu = menu.add_submenu('AutoNestCut')
        
        autonest_menu.add_item('Generate Cut List') { AutoNestCut::activate_extension }
        autonest_menu.add_separator
        autonest_menu.add_item('Documentation - How to...') { AutoNestCut.show_documentation }
        
        # Add license menu if licensing system is available
        if defined?(AutoNestCut::LicenseDialog)
          autonest_menu.add_separator
          autonest_menu.add_item('Purchase License') { AutoNestCut.open_purchase_page }
          autonest_menu.add_item('License Info') { AutoNestCut::LicenseDialog.show }
        end
        
        # Add trial status menu if trial manager is available
        if defined?(AutoNestCut::TrialManager)
          autonest_menu.add_item('Trial Status') { AutoNestCut::TrialManager.show_trial_status }
        end

        # Create toolbar with icon
        toolbar = UI::Toolbar.new('AutoNestCut')
        cmd = UI::Command.new('AutoNestCut') { AutoNestCut::activate_extension }
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
  end
end

# Setup UI when extension loads
if __FILE__ == $0 || !file_loaded?(__FILE__)
  AutoNestCut.setup_ui
  
  # Check for existing trial on startup (silent check)
  if defined?(AutoNestCut::LicenseManager) && defined?(AutoNestCut::TrialManager)
    unless AutoNestCut::LicenseManager.has_valid_license?
      # This will silently restore trial if one exists
      AutoNestCut::LicenseManager.check_existing_trial(false)
    end
    
    # Start trial countdown if trial is active
    if AutoNestCut::TrialManager.trial_active?
      AutoNestCut::TrialManager.start_trial_countdown
    end
  end
  
  file_loaded(__FILE__)
end
