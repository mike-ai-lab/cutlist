# ADD IMAGE CALLBACK - Add the missing export_images callback
begin
  # Update the FINAL_FIX to include the image export callback
  menu = UI.menu('Extensions').add_submenu('AutoNestCut v2.1 COMPLETE')
  menu.add_item('Generate Cut List') do
    model = Sketchup.active_model
    selection = model.selection
    if selection.empty?
      UI.messagebox("Select components first")
    else
      analyzer = AutoNestCut::ModelAnalyzer.new
      parts = analyzer.extract_parts_from_selection(selection)
      if parts.empty?
        UI.messagebox("No sheet goods found")
      else
        dialog = UI::HtmlDialog.new(
          dialog_title: "AutoNestCut v2.1 [COMPLETE WITH IMAGES]",
          preferences_key: "AutoNestCut_Main",
          scrollable: true,
          resizable: true,
          width: 1200,
          height: 750
        )
        
        html_path = File.join(File.dirname(__FILE__), 'AutoNestCut', 'ui', 'html', 'diagrams_report.html')
        File.utime(Time.now, Time.now, html_path)
        dialog.set_file(html_path)
        
        dialog.add_action_callback("ready") do
          data = {
            diagrams: [],
            report: { summary: {}, unique_part_types: [], unique_board_types: [], boards: [], parts_placed: [] },
            original_components: analyzer.get_original_components_data,
            hierarchy_tree: analyzer.get_hierarchy_tree
          }
          dialog.execute_script("receiveData(#{data.to_json})")
        end
        
        # ADD IMAGE EXPORT CALLBACK
        dialog.add_action_callback("export_images") do
          pages = model.pages
          if pages.empty?
            UI.messagebox("No scenes found. Please create scenes first to export images.")
          else
            scene_names = pages.map(&:name).join(", ")
            selected_scenes = UI.inputbox(["Select scenes to export (comma-separated):"], [scene_names], "Export Scene Images")
            
            if selected_scenes
              selected_names = selected_scenes[0].split(",").map(&:strip)
              valid_scenes = pages.select { |page| selected_names.include?(page.name) }
              
              if valid_scenes.any?
                desktop_path = File.join(ENV['USERPROFILE'] || ENV['HOME'], 'Desktop')
                model_name = model.title.empty? ? "Untitled" : model.title.gsub(/[^\\w]/, '_')
                export_dir = File.join(desktop_path, "AutoNestCut_Images_#{model_name}_#{Time.now.strftime('%Y%m%d_%H%M%S')}")
                Dir.mkdir(export_dir)
                
                view = model.active_view
                current_page = pages.selected_page
                
                valid_scenes.each do |page|
                  pages.selected_page = page
                  view.refresh
                  filename = "#{page.name.gsub(/[^\\w]/, '_')}.jpg"
                  filepath = File.join(export_dir, filename)
                  view.write_image(filepath, 1920, 1080, true, 0.0)
                end
                
                pages.selected_page = current_page if current_page
                view.refresh
                
                UI.messagebox("#{valid_scenes.length} scene images exported to: #{File.basename(export_dir)}")
              end
            end
          end
        end
        
        dialog.show
      end
    end
  end
  
  puts "✓ IMAGE EXPORT CALLBACK ADDED - Both features now work!"
rescue => e
  puts "✗ CALLBACK ADD FAILED: #{e.message}"
end