module AutoNestCut
  class Board
    attr_accessor :material, :stock_width, :stock_height, :parts_on_board
    
    def initialize(material, stock_width, stock_height)
      @material = material
      @stock_width = stock_width
      @stock_height = stock_height
      @parts_on_board = []
    end
    
    def add_part(part, x, y)
      part.x = x
      part.y = y
      @parts_on_board << part
    end
    
    def used_area
      @parts_on_board.sum(&:area)
    end
    
    def total_area
      @stock_width * @stock_height
    end
    
    def waste_area
      total_area - used_area
    end
    
    def calculate_waste_percentage
      return 0 if total_area == 0
      (waste_area.to_f / total_area * 100).round(2)
    end
    
    def efficiency_percentage
      100 - calculate_waste_percentage
    end
    
    def can_fit_part?(part, x, y, kerf_width = 0)
      part_right = x + part.width + kerf_width
      part_bottom = y + part.height + kerf_width
      
      return false if part_right > @stock_width || part_bottom > @stock_height
      
      # Check for overlaps with existing parts
      @parts_on_board.each do |existing_part|
        existing_right = existing_part.x + existing_part.width + kerf_width
        existing_bottom = existing_part.y + existing_part.height + kerf_width
        
        # Check if rectangles overlap
        if !(x >= existing_right || part_right <= existing_part.x ||
             y >= existing_bottom || part_bottom <= existing_part.y)
          return false
        end
      end
      
      true
    end
    
    def find_best_position(part, kerf_width = 0)
      return nil if part.width + kerf_width > @stock_width || part.height + kerf_width > @stock_height
      
      # Simple bottom-left placement
      (0..(@stock_height - part.height - kerf_width)).step(10) do |y|
        (0..(@stock_width - part.width - kerf_width)).step(10) do |x|
          return [x, y] if can_fit_part?(part, x, y, kerf_width)
        end
      end
      nil
    end
    
    def to_h
      {
        material: @material,
        stock_width: @stock_width,
        stock_height: @stock_height,
        parts_count: @parts_on_board.length,
        used_area: used_area,
        waste_area: waste_area,
        waste_percentage: calculate_waste_percentage,
        efficiency_percentage: efficiency_percentage,
        parts: @parts_on_board.map(&:to_h)
      }
    end
  end
end