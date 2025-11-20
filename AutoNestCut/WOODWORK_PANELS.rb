# Generate a set of kitchen woodworking panels for cutlist testing
# Author: Muhamad Shkeir Automation Script
# Path: C:\Users\Administrator\Documents\Automations\GenerateKitchenPanels.rb

require 'sketchup.rb'

module KitchenTools
  module GenerateWoodPanels

    def self.run
      model = Sketchup.active_model
      entities = model.active_entities
      definitions = model.definitions

      model.start_operation("Generate Kitchen Panels", true)

      # Material setup
      mat_name = "Plywood_08_1K"
      material = model.materials[mat_name]
      unless material
        material = model.materials.add(mat_name)
        material.color = [210, 180, 140] # light wood color
      end

      # Dimensions for typical kitchen parts (in mm)
      panel_specs = [
        ["Side Panel Left",     720, 560, 18],
        ["Side Panel Right",    720, 560, 18],
        ["Bottom Shelf",        560, 560, 18],
        ["Top Shelf",           560, 560, 18],
        ["Back Panel",          720, 560, 8],
        ["Drawer Side Left",    120, 500, 12],
        ["Drawer Side Right",   120, 500, 12],
        ["Drawer Front",        150, 500, 18],
        ["Drawer Back",         150, 500, 12],
        ["Drawer Bottom",       500, 480, 8],
        ["Cabinet Door Left",   720, 295, 18],
        ["Cabinet Door Right",  720, 295, 18],
        ["Top Cover Panel",     600, 600, 18],
        ["Bottom Base Panel",   600, 600, 18],
        ["Divider Panel",       720, 550, 18],
        ["Shelf 1",             550, 550, 18],
        ["Shelf 2",             550, 550, 18],
        ["Shelf 3",             550, 550, 18],
        ["Drawer Divider",      100, 480, 12],
        ["Door Frame Inner",    700, 100, 18],
        ["Door Frame Outer",    700, 100, 18],
        ["Panel Small A",       300, 200, 18],
        ["Panel Small B",       400, 250, 18],
        ["Panel Small C",       450, 300, 18],
        ["Kickboard Panel",     100, 600, 18]
      ]

      # Arrange panels in a grid layout to avoid overlap
      spacing_x = 650.mm
      spacing_y = 800.mm
      cols = 5

      panel_specs.each_with_index do |spec, i|
        name, width, height, thickness = spec
        x_index = i % cols
        y_index = (i / cols).floor
        base_point = Geom::Point3d.new(x_index * spacing_x, y_index * spacing_y, 0)

        definition = definitions.add(name)
        pts = [
          [0, 0, 0],
          [width.mm, 0, 0],
          [width.mm, height.mm, 0],
          [0, height.mm, 0]
        ]
        face = definition.entities.add_face(pts)
        face.reverse! if face.normal.z < 0
        face.pushpull(thickness.mm)

        instance = entities.add_instance(definition, Geom::Transformation.new(base_point))
        instance.material = material
        instance.layer = model.layers.add("KitchenPanels")
      end

      model.commit_operation

      UI.messagebox("25 kitchen wood panels generated successfully with Plywood_08_1K material.")

    end

    unless file_loaded?(__FILE__)
      UI.menu("Plugins").add_item("Generate Kitchen Panels") { self.run }
      file_loaded(__FILE__)
    end

  end
end
