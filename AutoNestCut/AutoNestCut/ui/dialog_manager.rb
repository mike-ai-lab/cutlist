module AutoNestCut
  class UIDialogManager
    
    def show_config_dialog(parts_by_material, original_components = [])
      @parts_by_material = parts_by_material
      @original_components = original_components
      settings = Config.load_settings
      
      @dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut",
        preferences_key: "AutoNestCut_Main",
        scrollable: true,
        resizable: true,
        width: 1200,
        height: 750
      )
      
      html_file = File.join(__dir__, 'html', 'main.html')
      @dialog.set_file(html_file)
      
      # Send initial data to dialog
      @dialog.add_action_callback("ready") do |action_context|
        data = {
          settings: settings,
          parts_by_material: serialize_parts_by_material(parts_by_material),
          original_components: original_components,
          model_materials: get_model_materials
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
            original_components: @original_components
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
      
      @dialog.add_action_callback("back_to_config") do |action_context|
        @dialog.execute_script("showConfigTab()")
      end
      
      @dialog.show
    end
    
    private
    
    def serialize_parts_by_material(parts_by_material)
      result = {}
      parts_by_material.each do |material, parts|
        result[material] = parts.map do |part|
          {
            name: part.name,
            width: part.width,
            height: part.height,
            thickness: part.thickness,
            total_quantity: part.total_quantity || 1
          }
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
    
    def export_csv_report(report_data)
      model_name = Sketchup.active_model.title.empty? ? "Untitled" : Sketchup.active_model.title.gsub(/[^\w]/, '_')
      
      # Auto-generate filename with incrementing number
      base_name = "Cutting_List_#{model_name}"
      counter = 1
      
      loop do
        filename = "#{base_name}_#{counter}.csv"
        full_path = File.join(ENV['USERPROFILE'] || ENV['HOME'], 'Desktop', filename)
        
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