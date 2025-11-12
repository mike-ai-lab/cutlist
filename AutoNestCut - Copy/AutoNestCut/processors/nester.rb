module AutoNestCut
  class Nester

    def optimize_boards(part_types_by_material_and_quantities, settings)
      boards = []
      stock_materials_config = settings['stock_materials']
      kerf_width = settings['kerf_width'].to_f || 3.0
      allow_rotation = settings['allow_rotation'] || true

      part_types_by_material_and_quantities.each do |material, types_and_quantities_for_material|
        stock_dims = stock_materials_config[material]
        if stock_dims.nil?
          # Auto-assign default sheet size for detected materials
          stock_width, stock_height = 2440.0, 1220.0
          Util.debug("Using default sheet size for material: #{material}")
          stock_materials_config[material] = { 'width' => stock_width, 'height' => stock_height, 'price' => 0 }
        elsif stock_dims.is_a?(Hash)
          stock_width = stock_dims['width'].to_f
          stock_height = stock_dims['height'].to_f
        elsif stock_dims.is_a?(Array) && stock_dims.length == 2
          stock_width, stock_height = stock_dims[0].to_f, stock_dims[1].to_f
        else
          stock_width, stock_height = 2440.0, 1220.0
        end

        all_individual_parts_to_place = []
        types_and_quantities_for_material.each do |entry|
          part_type = entry[:part_type]
          total_quantity = entry[:total_quantity]
          total_quantity.times do
            individual_part_instance = part_type.create_placed_instance
            all_individual_parts_to_place << individual_part_instance
          end
        end

        material_boards = nest_individual_parts(all_individual_parts_to_place, material, stock_width, stock_height, kerf_width, allow_rotation)
        boards.concat(material_boards)
      end
      boards
    end

    private

    def nest_individual_parts(individual_parts_to_place, material, stock_width, stock_height, kerf_width, allow_rotation)
      boards = []
      remaining_parts = individual_parts_to_place.dup

      remaining_parts.sort_by! { |part_instance| -part_instance.area }

      while !remaining_parts.empty?
        board = Board.new(material, stock_width, stock_height)
        parts_successfully_placed_on_this_board = []
        parts_that_could_not_fit_yet = []

        remaining_parts.each do |part_instance|
          if try_place_part_on_board(part_instance, board, kerf_width, allow_rotation)
            parts_successfully_placed_on_this_board << part_instance
          else
            parts_that_could_not_fit_yet << part_instance
          end
        end
        remaining_parts = parts_that_could_not_fit_yet

        if !parts_successfully_placed_on_this_board.empty?
          boards << board
        else
          UI.messagebox("Warning: Could not place #{remaining_parts.length} parts of material '#{material}' on a new board. They might be too large or the nesting algorithm failed.") if !remaining_parts.empty?
          break
        end
      end
      boards
    end

    def try_place_part_on_board(part_instance, board, kerf_width, allow_rotation)
      original_width = part_instance.width
      original_height = part_instance.height
      original_rotated_state = part_instance.rotated

      position = board.find_best_position(part_instance, kerf_width)
      if position
        board.add_part(part_instance, position[0], position[1])
        return true
      end

      if allow_rotation && part_instance.can_rotate?
        part_instance.rotate!
        position = board.find_best_position(part_instance, kerf_width)
        if position
          board.add_part(part_instance, position[0], position[1])
          return true
        else
          part_instance.rotate!
          part_instance.width = original_width
          part_instance.height = original_height
          part_instance.rotated = original_rotated_state
        end
      end
      false
    end
  end
end