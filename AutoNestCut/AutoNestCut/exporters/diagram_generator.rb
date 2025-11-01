module AutoNestCut
  class DiagramGenerator
    
    def draw_diagrams(boards, origin_point = [10000, 0, 0], spacing = 3000)
      model = Sketchup.active_model
      
      # Create a new scene for diagrams
      pages = model.pages
      page = pages.add("AutoNestCut Diagrams")
      pages.selected_page = page
      
      # Clear existing entities in a new group
      entities = model.entities
      diagram_group = entities.add_group
      
      current_x = origin_point[0]
      
      boards.each_with_index do |board, index|
        draw_single_board(diagram_group.entities, board, [current_x, origin_point[1], origin_point[2]], index + 1)
        current_x += board.stock_width + spacing
      end
      
      # Zoom to fit all diagrams
      model.active_view.zoom_extents
    end
    
    private
    
    def draw_single_board(entities, board, origin, board_number)
      x, y, z = origin
      
      # Draw board outline (just edges, no face)
      board_points = [
        [x, y, z],
        [x + board.stock_width, y, z],
        [x + board.stock_width, y + board.stock_height, z],
        [x, y + board.stock_height, z]
      ]
      
      entities.add_edges(board_points + [board_points[0]])
      
      # Add board label
      board_label = "#{board.material} Board #{board_number}\n#{board.stock_width}mm x #{board.stock_height}mm\nWaste: #{board.calculate_waste_percentage}%"
      entities.add_text(board_label, [x, y + board.stock_height + 200, z])
      
      # Draw parts on board
      board.parts_on_board.each_with_index do |part, part_index|
        draw_part_on_board(entities, part, x, y, z, part_index + 1)
      end
    end
    
    def draw_part_on_board(entities, part, board_x, board_y, board_z, part_number)
      part_x = board_x + part.x
      part_y = board_y + part.y
      
      # Draw part rectangle
      part_points = [
        [part_x, part_y, board_z],
        [part_x + part.width, part_y, board_z],
        [part_x + part.width, part_y + part.height, board_z],
        [part_x, part_y + part.height, board_z]
      ]
      
      part_face = entities.add_face(part_points)
      part_face.material = get_part_color(part_number)
      
      # Add part label
      part_label = "P#{part_number}: #{part.name}\n#{part.width.round}x#{part.height.round}mm"
      if part.rotated
        part_label += "\n(Rotated)"
      end
      
      label_x = part_x + part.width / 2
      label_y = part_y + part.height / 2
      entities.add_text(part_label, [label_x, label_y, board_z])
      
      # Draw part outline
      entities.add_edges(part_points + [part_points[0]])
    end
    
    def get_part_color(part_number)
      colors = [[255,0,0], [0,0,255], [0,255,0], [255,255,0], [255,165,0], [128,0,128], [0,255,255], [255,0,255]]
      colors[(part_number - 1) % colors.length]
    end
  end
end