module AutoNestCut
  class Nester
    
    def optimize_boards(parts_by_material, settings)
      boards = []
      stock_materials = settings['stock_materials']
      kerf_width = settings['kerf_width'] || 3.0
      allow_rotation = settings['allow_rotation'] || true
      
      parts_by_material.each do |material, parts|
        stock_dims = stock_materials[material]
        next unless stock_dims
        
        stock_width, stock_height = stock_dims
        material_boards = nest_parts_for_material(parts, material, stock_width, stock_height, kerf_width, allow_rotation)
        boards.concat(material_boards)
      end
      
      boards
    end
    
    private
    
    def nest_parts_for_material(parts, material, stock_width, stock_height, kerf_width, allow_rotation)
      boards = []
      remaining_parts = parts.dup
      
      # Sort parts by area (largest first) for better packing
      remaining_parts.sort_by! { |part| -part.area }
      
      while !remaining_parts.empty?
        board = Board.new(material, stock_width, stock_height)
        parts_placed = []
        
        remaining_parts.each do |part|
          if try_place_part_on_board(part, board, kerf_width, allow_rotation)
            parts_placed << part
          end
        end
        
        puts "Board #{boards.length + 1}: Placed #{parts_placed.length} parts"
        
        # Remove placed parts from remaining
        remaining_parts -= parts_placed
        
        # Only add board if we placed at least one part
        boards << board if !parts_placed.empty?
        
        # Safety check to prevent infinite loop
        if parts_placed.empty? && !remaining_parts.empty?
          puts "Warning: Could not place remaining #{remaining_parts.length} parts"
          break
        end
      end
      
      boards
    end
    
    def try_place_part_on_board(part, board, kerf_width, allow_rotation)
      # Try original orientation first
      position = board.find_best_position(part, kerf_width)
      if position
        board.add_part(part, position[0], position[1])
        return true
      end
      
      # Try rotated orientation if allowed
      if allow_rotation && part.can_rotate?
        part.rotate!
        position = board.find_best_position(part, kerf_width)
        if position
          board.add_part(part, position[0], position[1])
          return true
        else
          # Rotate back if couldn't place
          part.rotate!
        end
      end
      
      false
    end
  end
end