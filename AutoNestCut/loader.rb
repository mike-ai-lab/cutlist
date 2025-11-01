require 'sketchup.rb'

module AutoNestCut
  EXTENSION_NAME = "AutoNestCut"
  EXTENSION_VERSION = "1.0.0"
  
  unless file_loaded?(__FILE__)
    # Load all files immediately
    base_path = File.dirname(__FILE__)
    
    require File.join(base_path, 'AutoNestCut', 'config')
    require File.join(base_path, 'AutoNestCut', 'util')
    require File.join(base_path, 'AutoNestCut', 'models', 'part')
    require File.join(base_path, 'AutoNestCut', 'models', 'board')
    require File.join(base_path, 'AutoNestCut', 'processors', 'model_analyzer')
    require File.join(base_path, 'AutoNestCut', 'processors', 'nester')
    require File.join(base_path, 'AutoNestCut', 'ui', 'dialog_manager')
    require File.join(base_path, 'AutoNestCut', 'exporters', 'diagram_generator')
    require File.join(base_path, 'AutoNestCut', 'exporters', 'report_generator')
    require File.join(base_path, 'AutoNestCut', 'main')
    
    ex = SketchupExtension.new(EXTENSION_NAME, File.join(base_path, 'AutoNestCut', 'main'))
    ex.description = 'Automated nesting and cut list generation for sheet goods'
    ex.version = EXTENSION_VERSION
    ex.copyright = '2024'
    ex.creator = 'AutoNestCut'
    
    Sketchup.register_extension(ex, true)
    file_loaded(__FILE__)
  end
end