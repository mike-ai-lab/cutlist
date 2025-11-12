require 'sketchup.rb'
require 'extensions.rb'

module AutoNestCut
  EXTENSION_NAME  = "AutoNestCut"
  EXTENSION_VER   = "1.0.0"
  EXTENSION_DESC  = "Automatic nesting and cutting optimization for SketchUp"

  plugin_dir = File.dirname(__FILE__)
  main_file  = File.join(plugin_dir, "main.rb")

  unless File.exist?(main_file)
    UI.messagebox("AutoNestCut error: main.rb not found at:\n#{main_file}")
    raise "AutoNestCut missing main.rb"
  end

  ex = SketchupExtension.new(EXTENSION_NAME, main_file)
  ex.version     = EXTENSION_VER
  ex.description = EXTENSION_DESC
  ex.creator     = "AutoNestCut"

  Sketchup.register_extension(ex, true)
end
