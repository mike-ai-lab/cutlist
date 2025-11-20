# AutoNestCut Smart Loader with HTML Monitor (Safe Version)
require 'sketchup'

module AutoNestCutSmartLoader
  EXT_PATH = "C:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension"
  LOADER_FILE = File.join(EXT_PATH, "loader.rb")
  MONITOR_HTML = File.join(EXT_PATH, "loader_monitor.html")

  @@last_mtimes = {}
  @@monitor_dialog = nil

  def self.log_to_html(message, type = 'info')
    return unless @@monitor_dialog
    safe_msg = message.to_s.gsub("'", "\\'")
    @@monitor_dialog.execute_script("window.loaderCallback && window.loaderCallback.log('#{safe_msg}', '#{type}')")
  end

  def self.open_monitor
    return if @@monitor_dialog
    
    @@monitor_dialog = UI::HtmlDialog.new(
      dialog_title: "Loader Monitor",
      preferences_key: "AutoNestCut_Loader_Monitor",
      scrollable: false,
      resizable: true,
      width: 300,
      height: 280,
      left: 100,
      top: 100,
      min_width: 250,
      min_height: 200
    )
    
    if File.exist?(MONITOR_HTML)
      @@monitor_dialog.set_file(MONITOR_HTML)
    else
      @@monitor_dialog.set_html("<h1>Monitor HTML not found</h1><p>#{MONITOR_HTML}</p>")
    end
    
    @@monitor_dialog.add_action_callback("manualRefresh") do
      log_to_html("Manual refresh triggered", 'info')
      do_reload
    end
    
    @@monitor_dialog.set_on_closed { @@monitor_dialog = nil }
    @@monitor_dialog.show
    
    log_to_html("Monitor started - ready for file monitoring", 'success')
  end

  def self.do_reload
    log_to_html("Cleaning constants and features...", 'info')
    
    Object.send(:remove_const, :AutoNestCut) if defined?(AutoNestCut)
    $LOADED_FEATURES.delete_if { |f| f.downcase.include?('autonestcut') }
    
    if File.exist?(LOADER_FILE)
      log_to_html("Loading #{File.basename(LOADER_FILE)}...", 'info')
      load LOADER_FILE
      log_to_html("Extension reloaded successfully", 'success')
    else
      log_to_html("Loader file not found: #{LOADER_FILE}", 'error')
    end
  end

  def self.scan_files
    Dir.glob("#{EXT_PATH}/**/*.rb").map { |f| [f, File.mtime(f)] }.to_h
  end

  def self.check_and_reload
    current = scan_files
    return if current == @@last_mtimes
    
    changed = current.select { |f, t| @@last_mtimes[f] != t }
    changed.each { |f, _| log_to_html("File changed: #{File.basename(f)}", 'file') }
    
    do_reload
    @@last_mtimes = current
  end

  # Initialize
  @@last_mtimes = scan_files
  do_reload
  
  # Open monitor window
  UI.start_timer(1, false) { open_monitor }
  
  # Check for changes every 3 seconds
  UI.start_timer(3, true) { check_and_reload }
end