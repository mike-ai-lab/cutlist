module AutoNestCut
  class UIDialogManager
    
    def show_config_dialog(parts_by_material)
      settings = Config.load_settings
      
      dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut Configuration",
        preferences_key: "AutoNestCut_Config",
        scrollable: true,
        resizable: true,
        width: 600,
        height: 500
      )
      
      html_file = File.join(__dir__, 'html', 'config.html')
      dialog.set_file(html_file)
      
      # Send initial data to dialog
      dialog.add_action_callback("ready") do |action_context|
        data = {
          settings: settings,
          parts_by_material: serialize_parts_by_material(parts_by_material)
        }
        dialog.execute_script("receiveInitialData(#{data.to_json})")
      end
      
      # Handle settings save and process
      dialog.add_action_callback("process") do |action_context, settings_json|
        begin
          new_settings = JSON.parse(settings_json)
          Config.save_settings(new_settings)
          dialog.close
          AutoNestCut.process_nesting(parts_by_material, new_settings)
        rescue => e
          UI.messagebox("Error processing settings: #{e.message}")
        end
      end
      
      dialog.show
    end
    
    def show_diagrams_and_report_dialog(boards, report_data)
      dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut Diagrams & Report",
        preferences_key: "AutoNestCut_DiagramsReport",
        scrollable: true,
        resizable: true,
        width: 1200,
        height: 750
      )
      
      html_file = File.join(__dir__, 'html', 'diagrams_report.html')
      dialog.set_file(html_file)
      
      dialog.add_action_callback("ready") do |action_context|
        data = {
          diagrams: boards.map(&:to_h),
          report: report_data,
          boards: boards.map(&:to_h)
        }
        puts "Sending data: #{data.inspect}"
        dialog.execute_script("receiveData(#{data.to_json})")
      end
      
      dialog.add_action_callback("export_csv") do |action_context|
        export_csv_report(report_data)
      end
      
      dialog.show
    end
    
    private
    
    def serialize_parts_by_material(parts_by_material)
      result = {}
      parts_by_material.each do |material, parts|
        result[material] = parts.map(&:to_h)
      end
      result
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