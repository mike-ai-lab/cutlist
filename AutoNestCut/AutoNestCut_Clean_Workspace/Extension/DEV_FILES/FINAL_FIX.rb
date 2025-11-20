# FINAL FIX - Fix the nil path issue
begin
  # Create menu directly with path fix
  menu = UI.menu('Extensions').add_submenu('AutoNestCut v2.1 FINAL')
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
        # Create dialog with fixed path
        dialog = UI::HtmlDialog.new(
          dialog_title: "AutoNestCut v2.1 [NEW FEATURES]",
          preferences_key: "AutoNestCut_Main",
          scrollable: true,
          resizable: true,
          width: 1200,
          height: 750
        )
        
        html_path = File.join(File.dirname(__FILE__), 'AutoNestCut', 'ui', 'html', 'diagrams_report.html')
        if File.exist?(html_path)
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
          
          dialog.show
        else
          UI.messagebox("HTML file not found at: #{html_path}")
        end
      end
    end
  end
  
  puts "✓ FINAL FIX COMPLETE - Fixed path issue"
rescue => e
  puts "✗ FINAL FIX FAILED: #{e.message}"
end