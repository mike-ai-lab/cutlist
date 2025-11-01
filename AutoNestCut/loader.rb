require 'sketchup.rb'

module AutoNestCut
  EXTENSION_NAME = "AutoNestCut"
  EXTENSION_VERSION = "1.0.0"
  
  unless file_loaded?(__FILE__)
    ex = SketchupExtension.new(EXTENSION_NAME, 'f:/alt_drive/cutlist/AutoNestCut/AutoNestCut/main')
    ex.description = 'Automated nesting and cut list generation for sheet goods'
    ex.version = EXTENSION_VERSION
    ex.copyright = '2024'
    ex.creator = 'AutoNestCut'
    
    Sketchup.register_extension(ex, true)
    file_loaded(__FILE__)
  end
end