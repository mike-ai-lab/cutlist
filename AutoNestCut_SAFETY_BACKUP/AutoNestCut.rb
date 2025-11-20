# AutoNestCut SketchUp Extension
# Main loader file for RBZ packaging

require 'sketchup.rb'

module AutoNestCut
  EXTENSION_NAME = "AutoNestCut"
  EXTENSION_VERSION = "1.0.0"
  
  # Load the main extension
  extension = SketchupExtension.new(EXTENSION_NAME, "AutoNestCut_Clean_Workspace/Extension/loader.rb")
  extension.description = "Automated cut list generation and nesting optimization for sheet goods"
  extension.version = EXTENSION_VERSION
  extension.copyright = "© 2024 AutoNestCut"
  extension.creator = "AutoNestCut Team"
  
  Sketchup.register_extension(extension, true)
end