require 'sketchup.rb'
require 'extensions.rb'

module AutoNestCut
  EXTENSION_NAME = "AutoNestCut"
  EXTENSION_VERSION = "1.0.0"
  
  unless file_loaded?(__FILE__)
    # Create the extension
    extension = SketchupExtension.new(EXTENSION_NAME, File.join(__dir__, 'AutoNestCut', 'main.rb'))
    extension.version = EXTENSION_VERSION
    extension.description = "Automatic nesting and cutting optimization for SketchUp"
    extension.creator = "AutoNestCut"
    extension.copyright = "2024"
    
    # Register the extension
    Sketchup.register_extension(extension, true)
    
    file_loaded(__FILE__)
  end
end
