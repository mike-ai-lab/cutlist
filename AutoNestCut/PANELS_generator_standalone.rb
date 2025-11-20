# Ensure the script runs within the SketchUp environment
module KitchenTestPanels

  # Method to create a single rectangular panel component and return an instance
  def self.create_panel(name, width, height, thickness, material_name, origin, model)
    model.start_operation("Create #{name}", true)

    # Get or create the material
    material = model.materials[material_name]
    
    # Create the geometry within a definition directly
    definition = model.definitions.add(name)
    entities = definition.entities
    
    # Vertices for the face
    pts = [
      Geom::Point3d.new(0, 0, 0),
      Geom::Point3d.new(width, 0, 0),
      Geom::Point3d.new(width, height, 0),
      Geom::Point3d.new(0, height, 0)
    ]
    
    face = entities.add_face(pts)
    
    # Push/Pull to give thickness
    if face.normal.z < 0
      face.reverse!
    end
    face.pushpull(thickness)

    # Apply material to the faces inside the definition
    definition.entities.each { |entity| entity.material = material if entity.is_a?(Sketchup::Face) }

    # Place an instance in the model at the specified origin
    transform = Geom::Transformation.new(origin)
    # Correct API usage: add_instance expects a ComponentDefinition and a Transformation
    instance = model.active_entities.add_instance(definition, transform)
    instance.name = name # Set the instance name in the Outliner
    
    model.commit_operation
    return instance
  end

  # Main method to generate all 25 panels
  def self.generate_panels
    model = Sketchup.active_model
    
    # Define common dimensions in inches (SketchUp API uses inches internally by default)
    thickness = 0.75 # 3/4 inch
    
    # Create materials in model if they don't exist
    materials_list = ["White Melamine", "Maple Wood", "Cherry Wood", "Black Shaker", "Grey Laminate"]
    materials_list.each do |mat_name|
        if model.materials[mat_name].nil?
            mat = model.materials.add(mat_name)
            # Assign simple arbitrary colors for demonstration
            case mat_name
            when "White Melamine" then mat.color = Sketchup::Color.new(240, 240, 240)
            when "Maple Wood"     then mat.color = Sketchup::Color.new(220, 180, 140)
            when "Cherry Wood"    then mat.color = Sketchup::Color.new(165, 42, 42)
            when "Black Shaker"   then mat.color = Sketchup::Color.new(30, 30, 30)
            when "Grey Laminate"  then mat.color = Sketchup::Color.new(180, 180, 180)
            end
        end
    end

    # Define the 25 specific panels to meet the requirement
    panel_specs = [
      [12, 24, "White Melamine"], [15, 24, "White Melamine"], [18, 24, "White Melamine"], [21, 24, "White Melamine"], [24, 24, "White Melamine"],
      [12, 30, "Maple Wood"], [15, 30, "Maple Wood"], [18, 30, "Maple Wood"], [21, 30, "Maple Wood"], [24, 30, "Maple Wood"],
      [12, 36, "Cherry Wood"], [15, 36, "Cherry Wood"], [18, 36, "Cherry Wood"], [21, 36, "Cherry Wood"], [24, 36, "Cherry Wood"],
      [12, 42, "Black Shaker"], [15, 42, "Black Shaker"], [18, 42, "Black Shaker"], [21, 42, "Black Shaker"], [24, 42, "Black Shaker"],
      [24, 12, "Grey Laminate"], [30, 15, "Grey Laminate"], [36, 18, "Grey Laminate"], [42, 21, "Grey Laminate"], [48, 24, "Grey Laminate"]
    ]

    x_offset = 0
    y_offset = 0
    panel_gap = 1.0 # 1 inch gap
    max_height_in_row = 0

    panel_specs.each_with_index do |spec, i|
      width, height, material = spec
      name = "#{material.split(' ').first}_Panel_#{width}x#{height}"
      
      origin = Geom::Point3d.new(x_offset, y_offset, 0)
      create_panel(name, width, height, thickness, material, origin, model)
      
      x_offset += width + panel_gap
      max_height_in_row = [max_height_in_row, height].max

      if (i + 1) % 5 == 0 # Move to next row after 5 panels
        x_offset = 0
        y_offset -= max_height_in_row + panel_gap
        max_height_in_row = 0
      end
    end
    UI.messagebox("Generated 25 test panels.")
  end

  # Setup the toolbar and command
  unless file_loaded?(__FILE__)
    cmd = UI::Command.new("Generate Test Panels") {
      self.generate_panels
    }
    cmd.tooltip = "Generate 25 kitchen cabinet test panels"
    cmd.status_bar_text = "Click to generate test panels in the model."
    
    toolbar = UI::Toolbar.new("Kitchen Test Panels")
    toolbar.add_item(cmd)
    toolbar.show
    file_loaded(__FILE__)
  end

end
