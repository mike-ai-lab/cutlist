module UStairsGeneratorEnhanced
  # --- Standard Dimensions (in millimeters) ---
  RISER_HEIGHT = 175.mm      # Vertical height of each step
  TREAD_DEPTH  = 260.mm      # Horizontal depth of each step
  STAIR_WIDTH  = 900.mm      # Width of each stair flight
  NUM_STEPS_PER_FLIGHT = 11

  # Dimensions for the U-turn landing and gap:
  LANDING_DEPTH_Y = STAIR_WIDTH # Depth of landing along Y-axis (direction of first flight)
  GAP_WIDTH_X = STAIR_WIDTH     # Space between the two parallel flights

  # --- Railing Dimensions ---
  HANDRAIL_HEIGHT_FROM_TREAD = 900.mm # Vertical distance from tread nosing to top of handrail
  HANDRAIL_WIDTH  = 50.mm             # Top surface width of the handrail
  HANDRAIL_DEPTH  = 70.mm             # Side surface depth of the handrail
  HANDRAIL_OFFSET_FROM_EDGE = 50.mm   # Horizontal offset from the stair's outer edge (to handrail's nearest edge)

  # --- Skirting Dimensions ---
  SKIRTING_THICKNESS = 20.mm
  SKIRTING_HEIGHT_ABOVE_NOSING = 100.mm # Minimum height of skirting above the line of the step nosings

  # Helper method to create a solid group
  def self.create_solid_group(entities_collection, name="Unnamed Group")
    group = entities_collection.add_group
    group.name = name
    group
  end

  # Helper method to apply a color to a group
  def self.apply_color(group, color_name)
    return unless group # Ensure group is not nil

    model = Sketchup.active_model
    material = model.materials[color_name]
    unless material
      material = model.materials.add(color_name)
      # Define some basic colors if they don't exist
      case color_name
      when "Blue"  then material.color = Sketchup::Color.new(0, 150, 255) # Light Blue
      when "White" then material.color = Sketchup::Color.new(240, 240, 240) # Off-white
      when "Wood"  then material.color = Sketchup::Color.new(139, 69, 19) # Saddle Brown
      when "Grey"  then material.color = Sketchup::Color.new(150, 150, 150) # Medium Grey
      when "DarkGrey" then material.color = Sketchup::Color.new(80, 80, 80)
      when "Wood_Handrail" then material.color = Sketchup::Color.new(139, 69, 19) # Specific wood for handrails
      end
    end
    group.material = material
  end

  # Helper to create a single step block (tread + riser)
  def self.create_step_block(entities_collection, x_origin, y_front, y_back, z_top, width, height, name_prefix)
    group = create_solid_group(entities_collection, "#{name_prefix}_Step")
    face_entities = group.entities

    # Points for the top face of the tread
    pt1 = Geom::Point3d.new(x_origin, y_front, z_top)
    pt2 = Geom::Point3d.new(x_origin + width, y_front, z_top)
    pt3 = Geom::Point3d.new(x_origin + width, y_back, z_top)
    pt4 = Geom::Point3d.new(x_origin, y_back, z_top)

    face = face_entities.add_face([pt1, pt2, pt3, pt4])
    # Ensure face is valid before pushpull
    if face.valid?
      face.pushpull(-height)
    else
      puts "Warning: Invalid face created for step at #{pt1.to_s}"
      group.erase! # Delete the empty group if face creation failed
      return nil
    end
    group
  end

  # Helper to generate the path points for a handrail on one side of a flight
  # `direction_y` is +1 for first flight, -1 for second flight
  # `x_centerline_position` is the X-coordinate for the centerline of the handrail
  def self.generate_handrail_path_points(flight_start_x, flight_start_y, flight_start_z,
                                         num_steps, direction_y, x_centerline_position)
    path_points = []
    # The Z of the nosing line for step `i` is `flight_start_z + (i+1) * RISER_HEIGHT`.
    # The handrail's Z is relative to this nosing line.

    (0..num_steps).each do |i|
      # Y-coordinate for the front edge of step 'i' (which is the nosing line)
      # For i=0, this is the start of the first tread (y=0 for flight1, y=start_y for flight2)
      # For i=NUM_STEPS_PER_FLIGHT, this is the level of the landing
      
      current_y = flight_start_y + (i * TREAD_DEPTH * direction_y)
      
      # Corrected Z calculation: Nosing line Z + HANDRAIL_HEIGHT_FROM_TREAD
      current_z_nosing_level = flight_start_z + ((i + 1) * RISER_HEIGHT)
      current_z = current_z_nosing_level + HANDRAIL_HEIGHT_FROM_TREAD

      path_points << Geom::Point3d.new(x_centerline_position, current_y, current_z)
    end
    path_points
  end

  # Helper to create a handrail using FollowMe
  # Added color_name parameter
  def self.create_handrail(entities_collection, path_points, name, color_name = nil)
    handrail_group = create_solid_group(entities_collection, name)
    group_entities = handrail_group.entities

    # Ensure there are enough points for a path
    unless path_points.length >= 2
      puts "Warning: Handrail path for #{name} has less than 2 points. Skipping creation."
      handrail_group.erase!
      return nil
    end

    # Create the profile face for FollowMe directly in the group's entities.
    # The profile is a rectangle in the XZ plane, centered on the origin, then transformed.
    profile_points_relative = [
      Geom::Point3d.new(-HANDRAIL_WIDTH / 2, 0, -HANDRAIL_DEPTH / 2),
      Geom::Point3d.new( HANDRAIL_WIDTH / 2, 0, -HANDRAIL_DEPTH / 2),
      Geom::Point3d.new( HANDRAIL_WIDTH / 2, 0,  HANDRAIL_DEPTH / 2),
      Geom::Point3d.new(-HANDRAIL_WIDTH / 2, 0,  HANDRAIL_DEPTH / 2)
    ]
    
    # Create an initial face at origin, then transform it
    face = group_entities.add_face(profile_points_relative)
    unless face.valid?
      puts "Warning: Initial profile face for handrail #{name} creation failed. Path: #{path_points.to_s}"
      handrail_group.erase!
      return nil
    end

    # Transform the profile to the start of the path using entities.transform_entities
    tr_move = Geom::Transformation.translation(path_points.first)
    group_entities.transform_entities(tr_move, face, *face.edges)

    # The path for FollowMe should be edges. Add a curve and get its edges.
    path_edges = group_entities.add_curve(path_points)
    
    if path_edges.count > 0
      face.followme(path_edges)
    else
      puts "Warning: FollowMe failed for handrail #{name}. Path edges could not be created."
      handrail_group.erase!
      return nil
    end
    
    # Ensure the original profile face is removed after FollowMe (it gets consumed by FollowMe, but good practice)
    face.erase! if face.valid?
    
    # Apply color after successful creation
    apply_color(handrail_group, color_name) if color_name

    puts "Handrail '#{name}' created successfully."
    handrail_group
  end
  
  # Helper to generate the profile points for a skirting on one side of a flight.
  # This function creates a closed polygon that outlines the skirting.
  # The skirting sits on the side of the stairs, with its bottom following the
  # top of treads and front of risers, and its top parallel to the nosing line.
  # `x_side` is the X-coordinate for this specific skirting plane.
  def self.generate_skirting_profile_points(x_side, flight_start_y, flight_start_z,
                                            num_steps, direction_y)
    profile_pts = []

    # 1. Start at the bottom-front corner of the first riser (ground level)
    # This point is at the X-plane of the skirting, at the Y-position of the front of the first step,
    # and at the Z-position of the ground (or flight_start_z).
    profile_pts << Geom::Point3d.new(x_side, flight_start_y, flight_start_z)

    # 2. Define the stepped bottom edge of the skirting, following risers and treads
    (0...num_steps).each do |i|
      # Y-coordinate for the front edge of the current tread/riser
      current_y_front_edge = flight_start_y + (i * TREAD_DEPTH * direction_y)
      # Y-coordinate for the back edge of the current tread/riser
      current_y_back_edge = flight_start_y + ((i + 1) * TREAD_DEPTH * direction_y)
      
      # Z-coordinate for the top of the current riser (also the top of the current tread)
      current_z_riser_top = flight_start_z + ((i + 1) * RISER_HEIGHT)

      # Go up the current riser (vertical segment) - from previous y_front_edge, to current z_riser_top
      profile_pts << Geom::Point3d.new(x_side, current_y_front_edge, current_z_riser_top)
      
      # Go along the top of the current tread (horizontal segment)
      profile_pts << Geom::Point3d.new(x_side, current_y_back_edge, current_z_riser_top)
    end
    
    # 3. Define the straight top edge of the skirting, parallel to the nosing line.
    # The 'line of the step nosings' for step 'i' is at Z = flight_start_z + (i+1)*RISER_HEIGHT
    # Its Y is flight_start_y + i*TREAD_DEPTH*direction_y.

    # Start point for the top edge of skirting (above the first step's nosing)
    top_edge_skirting_start_y = flight_start_y
    top_edge_skirting_start_z = (flight_start_z + RISER_HEIGHT) + SKIRTING_HEIGHT_ABOVE_NOSING

    # End point for the top edge of skirting (above the last step's nosing, before landing)
    top_edge_skirting_end_y = flight_start_y + NUM_STEPS_PER_FLIGHT * TREAD_DEPTH * direction_y
    top_edge_skirting_end_z = (flight_start_z + (NUM_STEPS_PER_FLIGHT * RISER_HEIGHT)) + SKIRTING_HEIGHT_ABOVE_NOSING

    # Add points for the top edge, going from end back to start to close the profile
    profile_pts << Geom::Point3d.new(x_side, top_edge_skirting_end_y, top_edge_skirting_end_z)
    profile_pts << Geom::Point3d.new(x_side, top_edge_skirting_start_y, top_edge_skirting_start_z)
    
    profile_pts
  end

  # Helper to create a skirting by adding a face and pushpulling it
  # Added color_name parameter
  def self.create_skirting(entities_collection, profile_points, extrusion_vector, name, color_name = nil)
    skirting_group = create_solid_group(entities_collection, name)
    group_entities = skirting_group.entities

    # Add the points to form a face
    face = group_entities.add_face(profile_points)

    if face.valid?
      # FIX: pushpull expects a Float, not a Vector3d.
      # Calculate the signed distance by projecting the extrusion vector onto the face normal.
      pushpull_distance = extrusion_vector.dot(face.normal)
      
      face.pushpull(pushpull_distance) # Pushpull with the calculated signed distance

      # Apply color after successful creation
      apply_color(skirting_group, color_name) if color_name
      puts "Skirting '#{name}' created successfully."
    else
      puts "Warning: Invalid face created for skirting #{name} at #{profile_points.first.to_s}"
      skirting_group.erase!
      return nil
    end
    skirting_group
  end

  def self.generate_stairs
    model = Sketchup.active_model
    entities = model.active_entities

    model.start_operation("Generate U-Shape Stairs Enhanced", true)

    # --- Main Group for the entire staircase ---
    u_stairs_assembly = create_solid_group(entities, "U_Stairs_Assembly")
    assembly_entities = u_stairs_assembly.entities

    # --- 1. First Flight ---
    first_flight_group = create_solid_group(assembly_entities, "First_Flight")
    apply_color(first_flight_group, "Blue")
    
    # Coordinates for the first flight
    # The first step (i=0) has its top at 1*riser_height.
    # The first step's Y-range is 0 to 1*tread_depth.
    flight1_start_x = 0
    flight1_start_y = 0
    flight1_start_z = 0 # Base Z for the flight's ground level

    (0...NUM_STEPS_PER_FLIGHT).each do |i|
      current_tread_z = (i + 1) * RISER_HEIGHT
      current_tread_y_front = i * TREAD_DEPTH
      current_tread_y_back  = (i + 1) * TREAD_DEPTH
      
      create_step_block(first_flight_group.entities, flight1_start_x, current_tread_y_front, 
                        current_tread_y_back, current_tread_z, STAIR_WIDTH, RISER_HEIGHT, "First_Flight_")
    end

    # --- 2. Landing ---
    landing_group = create_solid_group(assembly_entities, "Landing")
    apply_color(landing_group, "Grey")

    landing_z_level = (NUM_STEPS_PER_FLIGHT + 1) * RISER_HEIGHT # Top surface of landing
    landing_y_start = NUM_STEPS_PER_FLIGHT * TREAD_DEPTH
    landing_y_end = landing_y_start + LANDING_DEPTH_Y
    landing_x_start = 0
    landing_x_end = STAIR_WIDTH + GAP_WIDTH_X + STAIR_WIDTH # Total width of the U-shape

    # Define the points for the top face of the landing.
    pt1_land = Geom::Point3d.new(landing_x_start, landing_y_start, landing_z_level)
    pt2_land = Geom::Point3d.new(landing_x_end, landing_y_start, landing_z_level)
    pt3_land = Geom::Point3d.new(landing_x_end, landing_y_end, landing_z_level)
    pt4_land = Geom::Point3d.new(landing_x_start, landing_y_end, landing_z_level)

    landing_face = landing_group.entities.add_face([pt1_land, pt2_land, pt3_land, pt4_land])
    landing_face.pushpull(-RISER_HEIGHT) if landing_face.valid?

    # --- 3. Second Flight ---
    second_flight_group = create_solid_group(assembly_entities, "Second_Flight")
    apply_color(second_flight_group, "White")

    flight2_x_offset = STAIR_WIDTH + GAP_WIDTH_X
    flight2_start_y = landing_y_end # Starts from the far edge of the landing
    flight2_start_z = landing_z_level - RISER_HEIGHT # Base Z for the flight's ground equivalent

    (0...NUM_STEPS_PER_FLIGHT).each do |j|
      current_tread_z = landing_z_level + (j + 1) * RISER_HEIGHT
      
      # Define the Y-coordinates for the tread, receding from flight2_start_y.
      tread_y_front = flight2_start_y - j * TREAD_DEPTH
      tread_y_back = flight2_start_y - (j + 1) * TREAD_DEPTH

      create_step_block(second_flight_group.entities, flight2_x_offset, tread_y_back,
                        tread_y_front, current_tread_z, STAIR_WIDTH, RISER_HEIGHT, "Second_Flight_")
    end

    # --- Generate Handrails ---
    # Handrail centerline offsets from respective flight edges
    handrail_x_offset_outer_f1 = flight1_start_x + STAIR_WIDTH - HANDRAIL_OFFSET_FROM_EDGE - HANDRAIL_WIDTH / 2
    handrail_x_offset_inner_f1 = flight1_start_x + HANDRAIL_OFFSET_FROM_EDGE + HANDRAIL_WIDTH / 2

    handrail_x_offset_outer_f2 = flight2_x_offset + STAIR_WIDTH - HANDRAIL_OFFSET_FROM_EDGE - HANDRAIL_WIDTH / 2
    handrail_x_offset_inner_f2 = flight2_x_offset + HANDRAIL_OFFSET_FROM_EDGE + HANDRAIL_WIDTH / 2
    
    # Outer Handrail Path (Correct as identified, no changes needed here)
    outer_handrail_path = []
    outer_handrail_path.concat(generate_handrail_path_points(flight1_start_x, flight1_start_y, flight1_start_z,
                                                          NUM_STEPS_PER_FLIGHT, 1, handrail_x_offset_outer_f1))
    
    handrail_landing_z = outer_handrail_path.last.z

    # Landing segment (L-shape for outer handrail)
    # Point 1: Move horizontally in X to the other side of the gap, same Y as end of F1
    outer_handrail_path << Geom::Point3d.new(handrail_x_offset_outer_f2, outer_handrail_path.last.y, handrail_landing_z)
    
    # Point 2: Move horizontally in Y along the landing depth, same X as start of F2
    outer_handrail_path << Geom::Point3d.new(handrail_x_offset_outer_f2, flight2_start_y, handrail_landing_z)

    # Points for Second Flight (slicing [1..-1] to avoid duplicate of previous point)
    outer_handrail_path.concat(generate_handrail_path_points(flight2_x_offset, flight2_start_y, flight2_start_z,
                                                          NUM_STEPS_PER_FLIGHT, -1, handrail_x_offset_outer_f2)[1..-1])

    create_handrail(assembly_entities, outer_handrail_path, "Outer_Handrail", "Wood_Handrail")

    # Inner Handrail Path (Corrected to fix jaggedness)
    inner_handrail_path = []
    inner_handrail_path.concat(generate_handrail_path_points(flight1_start_x, flight1_start_y, flight1_start_z,
                                                          NUM_STEPS_PER_FLIGHT, 1, handrail_x_offset_inner_f1))
    
    landing_rail_z = inner_handrail_path.last.z

    turn_offset = HANDRAIL_OFFSET_FROM_EDGE + HANDRAIL_WIDTH/2

    # Inner rail segment 1: Moves along Y towards the 'back' of the landing (along the gap)
    inner_handrail_path << Geom::Point3d.new(handrail_x_offset_inner_f1, 
                                            landing_y_end - turn_offset, 
                                            landing_rail_z)

    # Inner rail segment 2: Moves along X across the gap
    inner_handrail_path << Geom::Point3d.new(handrail_x_offset_inner_f2, 
                                            landing_y_end - turn_offset, 
                                            landing_rail_z)

    # FIX: Add an explicit point at the start of the second flight's handrail before concatenating.
    # This ensures a straight segment instead of a diagonal one.
    inner_handrail_path << Geom::Point3d.new(handrail_x_offset_inner_f2, 
                                            landing_y_end, # Y-coordinate matches where F2 handrail segment starts
                                            landing_rail_z)
    
    # Concatenate the rest of the second flight points, skipping the first one (index 0)
    # because it's now explicitly added above.
    inner_handrail_path.concat(generate_handrail_path_points(flight2_x_offset, flight2_start_y, flight2_start_z,
                                                          NUM_STEPS_PER_FLIGHT, -1, handrail_x_offset_inner_f2)[1..-1])

    create_handrail(assembly_entities, inner_handrail_path, "Inner_Handrail", "Wood_Handrail")
    
    # --- Generate Skirtings ---
    skirting_color = "DarkGrey"
    
    # First Flight Outer Skirting
    skirting_profile_f1_outer = generate_skirting_profile_points(flight1_start_x + STAIR_WIDTH, flight1_start_y, flight1_start_z, NUM_STEPS_PER_FLIGHT, 1)
    create_skirting(assembly_entities, skirting_profile_f1_outer, Geom::Vector3d.new(SKIRTING_THICKNESS, 0, 0), "First_Flight_Outer_Skirting", skirting_color)

    # First Flight Inner Skirting
    skirting_profile_f1_inner = generate_skirting_profile_points(flight1_start_x, flight1_start_y, flight1_start_z, NUM_STEPS_PER_FLIGHT, 1)
    create_skirting(assembly_entities, skirting_profile_f1_inner, Geom::Vector3d.new(-SKIRTING_THICKNESS, 0, 0), "First_Flight_Inner_Skirting", skirting_color)

    # Landing Skirtings (panels on top of the landing surface)
    land_skirt_z_bottom = landing_z_level
    land_skirt_z_top = landing_z_level + SKIRTING_HEIGHT_ABOVE_NOSING

    # Landing Front Skirting
    sk_land_front_pts = [
      Geom::Point3d.new(landing_x_start, landing_y_start, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_start, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_start, land_skirt_z_top),
      Geom::Point3d.new(landing_x_start, landing_y_start, land_skirt_z_top)
    ]
    create_skirting(assembly_entities, sk_land_front_pts, Geom::Vector3d.new(0, -SKIRTING_THICKNESS, 0), "Landing_Front_Skirting", skirting_color)

    # Landing Back Skirting
    sk_land_back_pts = [
      Geom::Point3d.new(landing_x_start, landing_y_end, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_end, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_end, land_skirt_z_top),
      Geom::Point3d.new(landing_x_start, landing_y_end, land_skirt_z_top)
    ]
    create_skirting(assembly_entities, sk_land_back_pts, Geom::Vector3d.new(0, SKIRTING_THICKNESS, 0), "Landing_Back_Skirting", skirting_color)

    # Landing Outer Skirting
    sk_land_outer_pts = [
      Geom::Point3d.new(landing_x_end, landing_y_start, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_end, land_skirt_z_bottom),
      Geom::Point3d.new(landing_x_end, landing_y_end, land_skirt_z_top),
      Geom::Point3d.new(landing_x_end, landing_y_start, land_skirt_z_top)
    ]
    create_skirting(assembly_entities, sk_land_outer_pts, Geom::Vector3d.new(SKIRTING_THICKNESS, 0, 0), "Landing_Outer_Skirting", skirting_color)
    
    # Landing Gap Left Skirting
    sk_land_gap_left_pts = [
      Geom::Point3d.new(STAIR_WIDTH, landing_y_start, land_skirt_z_bottom),
      Geom::Point3d.new(STAIR_WIDTH, landing_y_end, land_skirt_z_bottom),
      Geom::Point3d.new(STAIR_WIDTH, landing_y_end, land_skirt_z_top),
      Geom::Point3d.new(STAIR_WIDTH, landing_y_start, land_skirt_z_top)
    ]
    create_skirting(assembly_entities, sk_land_gap_left_pts, Geom::Vector3d.new(-SKIRTING_THICKNESS, 0, 0), "Landing_Gap_Left_Skirting", skirting_color)

    # Landing Gap Right Skirting
    sk_land_gap_right_pts = [
      Geom::Point3d.new(STAIR_WIDTH + GAP_WIDTH_X, landing_y_start, land_skirt_z_bottom),
      Geom::Point3d.new(STAIR_WIDTH + GAP_WIDTH_X, landing_y_end, land_skirt_z_bottom),
      Geom::Point3d.new(STAIR_WIDTH + GAP_WIDTH_X, landing_y_end, land_skirt_z_top),
      Geom::Point3d.new(STAIR_WIDTH + GAP_WIDTH_X, landing_y_start, land_skirt_z_top)
    ]
    create_skirting(assembly_entities, sk_land_gap_right_pts, Geom::Vector3d.new(SKIRTING_THICKNESS, 0, 0), "Landing_Gap_Right_Skirting", skirting_color)


    # Second Flight Outer Skirting
    skirting_profile_f2_outer = generate_skirting_profile_points(flight2_x_offset + STAIR_WIDTH, flight2_start_y, flight2_start_z, NUM_STEPS_PER_FLIGHT, -1)
    create_skirting(assembly_entities, skirting_profile_f2_outer, Geom::Vector3d.new(SKIRTING_THICKNESS, 0, 0), "Second_Flight_Outer_Skirting", skirting_color)

    # Second Flight Inner Skirting
    skirting_profile_f2_inner = generate_skirting_profile_points(flight2_x_offset, flight2_start_y, flight2_start_z, NUM_STEPS_PER_FLIGHT, -1)
    create_skirting(assembly_entities, skirting_profile_f2_inner, Geom::Vector3d.new(-SKIRTING_THICKNESS, 0, 0), "Second_Flight_Inner_Skirting", skirting_color)


    # Commit the undo operation.
    model.commit_operation
    
    # Clear current selection, select the newly created stairs group, and zoom to its extents.
    model.selection.clear
    model.selection.add(u_stairs_assembly)
    Sketchup.active_model.active_view.zoom_extents
  end
end

# Example usage:
# Call the method to generate the stairs.
UStairsGeneratorEnhanced.generate_stairs
