module AutoNestCut
  class UIDialogManager
    
    def show_config_dialog(parts_by_material, original_components = [], hierarchy_tree = [])
      @parts_by_material = parts_by_material
      @original_components = original_components
      @hierarchy_tree = hierarchy_tree
      settings = Config.load_settings
      
      # Use HtmlDialog for SU2017+ or WebDialog for older versions
      if defined?(UI::HtmlDialog)
        @dialog = UI::HtmlDialog.new(
          dialog_title: "AutoNestCut",
          preferences_key: "AutoNestCut_Main",
          scrollable: true,
          resizable: true,
          width: 1200,
          height: 750
        )
      else
        @dialog = UI::WebDialog.new(
          "AutoNestCut",
          true,
          "AutoNestCut_Main",
          1200,
          750,
          100,
          100,
          true
        )
      end
      
      html_file = File.join(__dir__, 'html', 'main.html')
      @dialog.set_file(html_file)
      
      # Send initial data to dialog
      @dialog.add_action_callback("ready") do |action_context|
        # Auto-load detected materials into settings
        settings['stock_materials'] ||= {}
        parts_by_material.keys.each do |material|
          unless settings['stock_materials'][material]
            settings['stock_materials'][material] = { 'width' => 2440, 'height' => 1220, 'price' => 0 }
          end
        end
        
        data = {
          settings: settings,
          parts_by_material: serialize_parts_by_material(parts_by_material),
          original_components: original_components,
          model_materials: get_model_materials,
          hierarchy_tree: @hierarchy_tree
        }
        @dialog.execute_script("receiveInitialData(#{data.to_json})")
      end
      
      # Handle settings save and process
      @dialog.add_action_callback("process") do |action_context, settings_json|
        begin
          new_settings = JSON.parse(settings_json)
          Config.save_settings(new_settings)
          
          nester = Nester.new
          boards = nester.optimize_boards(@parts_by_material, new_settings)
          
          if boards.empty?
            @dialog.execute_script("showError('No boards could be generated.')")
            return
          end
          
          report_generator = ReportGenerator.new
          report_data = report_generator.generate_report_data(boards, new_settings)
          
          data = {
            diagrams: boards.map(&:to_h),
            report: report_data,
            boards: boards.map(&:to_h),
            original_components: @original_components,
            hierarchy_tree: @hierarchy_tree
          }
          @dialog.execute_script("showReportTab(#{data.to_json})")
        rescue => e
          @dialog.execute_script("showError('Error processing: #{e.message}')")
        end
      end
      
      @dialog.add_action_callback("export_csv") do |action_context, report_data_json|
        begin
          if report_data_json && !report_data_json.empty?
            report_data = JSON.parse(report_data_json, symbolize_names: true)
            export_csv_report(report_data)
          else
            UI.messagebox("Error exporting CSV: No report data available")
          end
        rescue => e
          UI.messagebox("Error exporting CSV: #{e.message}")
        end
      end
      
      @dialog.add_action_callback("export_html") do |action_context|
        # HTML export is handled entirely in JavaScript
        # This callback exists for potential future server-side HTML generation
      end
      
      @dialog.add_action_callback("back_to_config") do |action_context|
        @dialog.execute_script("showConfigTab()")
      end
      
      @dialog.add_action_callback("load_default_materials") do |action_context|
        defaults = MaterialsDatabase.get_default_materials
        MaterialsDatabase.save_database(defaults)
        @dialog.execute_script("location.reload()")
      end
      
      @dialog.add_action_callback("import_materials_csv") do |action_context|
        file_path = UI.openpanel("Select Materials CSV File", "", "CSV Files|*.csv||")
        if file_path
          imported = MaterialsDatabase.import_csv(file_path)
          unless imported.empty?
            existing = MaterialsDatabase.load_database
            merged = existing.merge(imported)
            MaterialsDatabase.save_database(merged)
            @dialog.execute_script("location.reload()")
            UI.messagebox("Imported #{imported.keys.length} materials successfully!")
          else
            UI.messagebox("No valid materials found in CSV file.")
          end
        end
      end
      
      @dialog.add_action_callback("export_materials_database") do |action_context|
        desktop_path = Compatibility.desktop_path
        filename = "AutoNestCut_Materials_Database_#{Time.now.strftime('%Y%m%d')}.csv"
        file_path = File.join(desktop_path, filename)
        
        materials = MaterialsDatabase.load_database
        MaterialsDatabase.save_database(materials)
        
        # Copy to desktop
        require 'fileutils'
        FileUtils.cp(MaterialsDatabase.database_file, file_path)
        UI.messagebox("Materials database exported to Desktop: #{filename}")
      end
      
      @dialog.add_action_callback("highlight_material") do |action_context, material_name|
        highlight_components_by_material(material_name)
      end
      
      @dialog.add_action_callback("clear_highlight") do |action_context|
        clear_component_highlight
      end
      
      @dialog.add_action_callback("refresh_config") do |action_context|
        refresh_configuration_data
      end
      
      @dialog.add_action_callback("refresh_report") do |action_context|
        refresh_report_data
      end
      
      @dialog.show
    end
    
    private
    
    def serialize_parts_by_material(parts_by_material)
      result = {}
      parts_by_material.each do |material, parts|
        result[material] = parts.map do |part_entry|
          if part_entry.is_a?(Hash) && part_entry[:part_type]
            part_type = part_entry[:part_type]
            {
              name: part_type.name,
              width: part_type.width,
              height: part_type.height,
              thickness: part_type.thickness,
              total_quantity: part_entry[:total_quantity] || 1
            }
          else
            {
              name: part_entry.name,
              width: part_entry.width,
              height: part_entry.height,
              thickness: part_entry.thickness,
              total_quantity: 1
            }
          end
        end
      end
      result
    end
    
    def get_model_materials
      materials = []
      Sketchup.active_model.materials.each do |material|
        materials << {
          name: material.display_name || material.name,
          color: material.color ? material.color.to_a[0..2] : [200, 200, 200]
        }
      end
      materials
    end
    
    def highlight_components_by_material(material_name)
      model = Sketchup.active_model
      selection = model.selection
      
      # Clear current selection
      selection.clear
      
      # Find components with matching material
      matching_components = []
      
      if @original_components && !@original_components.empty?
        @original_components.each do |comp_data|
          # Improved material matching - handle different material name formats
          comp_material = comp_data[:material].to_s.strip
          search_material = material_name.to_s.strip
          
          # Direct match or partial match
          if comp_material == search_material || 
             comp_material.downcase == search_material.downcase ||
             comp_material.include?(search_material) ||
             search_material.include?(comp_material)
            
            # Find component by entity ID in all entities
            found_entity = find_entity_by_id(model, comp_data[:entity_id])
            if found_entity
              matching_components << found_entity
            end
          end
        end
      end
      
      # Add matching components to selection for highlighting
      matching_components.each { |comp| selection.add(comp) }
      
      # Smooth zoom to selection if components found
      if matching_components.any?
        # Get current camera position for smooth transition
        view = model.active_view
        current_camera = view.camera
        
        # Zoom to selection with smooth transition
        view.zoom(matching_components)
        
        # Optional: Add a subtle status message instead of popup
        model.set_attribute('AutoNestCut_Status', 'last_highlight', "#{matching_components.length} components highlighted")
      else
        # Show error message for debugging
        puts "DEBUG: No components found with material: #{material_name}"
        puts "DEBUG: Available materials: #{@original_components.map{|c| c[:material]}.uniq.join(', ')}"
        UI.messagebox("No components found with material: #{material_name}")
      end
    end
    
    def find_entity_by_id(model, entity_id)
      return nil unless entity_id
      
      # Search in main model entities
      model.entities.each do |entity|
        return entity if entity.entityID == entity_id
        
        # Search in groups and components recursively
        if entity.is_a?(Sketchup::Group)
          found = find_entity_in_container(entity, entity_id)
          return found if found
        elsif entity.is_a?(Sketchup::ComponentInstance)
          found = find_entity_in_container(entity.definition, entity_id)
          return found if found
        end
      end
      nil
    end
    
    def find_entity_in_container(container, entity_id)
      return nil unless container.respond_to?(:entities)
      
      container.entities.each do |entity|
        return entity if entity.entityID == entity_id
        
        # Recursive search in nested containers
        if entity.is_a?(Sketchup::Group)
          found = find_entity_in_container(entity, entity_id)
          return found if found
        elsif entity.is_a?(Sketchup::ComponentInstance)
          found = find_entity_in_container(entity.definition, entity_id)
          return found if found
        end
      end
      nil
    end
    
    def clear_component_highlight
      Sketchup.active_model.selection.clear
    end
    
    def refresh_configuration_data
      # Re-analyze current selection
      model = Sketchup.active_model
      selection = model.selection
      
      if selection.empty?
        @dialog.execute_script("showError('Please select components or groups to analyze for refresh.')")
        return
      end
      
      begin
        analyzer = ModelAnalyzer.new
        @parts_by_material = analyzer.extract_parts_from_selection(selection)
        @original_components = analyzer.get_original_components_data
        @hierarchy_tree = analyzer.get_hierarchy_tree
        
        if @parts_by_material.empty?
          @dialog.execute_script("showError('No valid sheet good parts found in your selection.')")
          return
        end
        
        # Update settings with new materials
        settings = Config.load_settings
        settings['stock_materials'] ||= {}
        @parts_by_material.keys.each do |material|
          unless settings['stock_materials'][material]
            settings['stock_materials'][material] = { 'width' => 2440, 'height' => 1220, 'price' => 0 }
          end
        end
        
        # Send refreshed data
        data = {
          settings: settings,
          parts_by_material: serialize_parts_by_material(@parts_by_material),
          original_components: @original_components,
          model_materials: get_model_materials,
          hierarchy_tree: @hierarchy_tree
        }
        @dialog.execute_script("receiveRefreshedData(#{data.to_json})")
      rescue => e
        @dialog.execute_script("showError('Error refreshing data: #{e.message}')")
      end
    end
    
    def refresh_report_data
      return unless @parts_by_material && !@parts_by_material.empty?
      
      begin
        # Get current settings from dialog
        @dialog.execute_script("refreshReportWithCurrentSettings()")
      rescue => e
        @dialog.execute_script("showError('Error refreshing report: #{e.message}')")
      end
    end
    
    def export_csv_report(report_data)
      model_name = Sketchup.active_model.title.empty? ? "Untitled" : Sketchup.active_model.title.gsub(/[^\w]/, '_')
      
      # Auto-generate filename with incrementing number
      base_name = "Cutting_List_#{model_name}"
      counter = 1
      
      # Cross-platform desktop path
      desktop_path = if RUBY_PLATFORM =~ /mswin|mingw|windows/
                       File.join(ENV['USERPROFILE'] || ENV['HOME'], 'Desktop')
                     else
                       File.join(ENV['HOME'], 'Desktop')
                     end
      
      loop do
        filename = "#{base_name}_#{counter}.csv"
        full_path = File.join(desktop_path, filename)
        
        unless File.exist?(full_path)
          begin
            ReportGenerator.new.export_csv(full_path, report_data)
            UI.messagebox("Cut list exported to Desktop: #{filename}")
            return
          rescue => e
            UI.messagebox("Error exporting CSV: #{e.message}")
            return
          end
        end
        
        counter += 1
      end
    end
  end
end