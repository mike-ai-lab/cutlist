# Cross-platform and version compatibility utilities
module AutoNestCut
  module Compatibility
    
    # Check if running on Windows
    def self.windows?
      RUBY_PLATFORM =~ /mswin|mingw|windows/
    end
    
    # Check if running on Mac
    def self.mac?
      RUBY_PLATFORM =~ /darwin/
    end
    
    # Get SketchUp version as integer
    def self.sketchup_version
      Sketchup.version.to_i
    end
    
    # Check if HtmlDialog is available (SU2017+)
    def self.html_dialog_available?
      defined?(UI::HtmlDialog)
    end
    
    # Get appropriate dialog class
    def self.dialog_class
      html_dialog_available? ? UI::HtmlDialog : UI::WebDialog
    end
    
    # Create cross-platform file path
    def self.safe_path(*parts)
      File.join(*parts)
    end
    
    # Get desktop path for current platform
    def self.desktop_path
      if windows?
        File.join(ENV['USERPROFILE'] || ENV['HOME'], 'Desktop')
      else
        File.join(ENV['HOME'], 'Desktop')
      end
    end
    
    # Check if file exists with cross-platform handling
    def self.file_exists?(path)
      File.exist?(path)
    end
    
  end
end