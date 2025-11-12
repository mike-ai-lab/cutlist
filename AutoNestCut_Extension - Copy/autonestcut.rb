require 'sketchup.rb'
require 'extensions.rb'

module AutoNestCut
  EXTENSION_NAME = "AutoNestCut"
  EXTENSION_VERSION = "1.0.0"

  unless file_loaded?(__FILE__)
    loader_file = File.join(__dir__, "main_secure.rbs")
    extension = SketchupExtension.new(EXTENSION_NAME, loader_file)

    extension.description = "Automatic nesting and cutting optimization for SketchUp"
    extension.version = EXTENSION_VERSION
    extension.creator = "AutoNestCut"

    Sketchup.register_extension(extension, true)
    file_loaded(__FILE__)
  end
end
