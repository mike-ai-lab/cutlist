module AutoNestCut
  class Part
    attr_accessor :name, :width, :height, :thickness, :material, :original_instance, :grain_direction, :x, :y, :rotated
    
    def initialize(component_instance)
      @original_instance = component_instance
      @name = component_instance.definition.name
      
      # Calculate dimensions from bounding box
      bounds = component_instance.definition.bounds
      dimensions = [bounds.width.to_mm, bounds.height.to_mm, bounds.depth.to_mm].sort
      
      @thickness = dimensions[0]
      @width = dimensions[1] 
      @height = dimensions[2]
      
      # Get material and grain direction
      @material = Config.get_material_from_component(component_instance)
      @grain_direction = Config.get_grain_direction(component_instance)
      
      # Position and rotation state
      @x = 0
      @y = 0
      @rotated = false
    end
    
    def rotate!
      return false if @grain_direction == 'fixed'
      
      @width, @height = @height, @width
      @rotated = !@rotated
      true
    end
    
    def area
      @width * @height
    end
    
    def can_rotate?
      @grain_direction != 'fixed'
    end
    
    def fits_in?(board_width, board_height, kerf_width = 0)
      w = @width + kerf_width
      h = @height + kerf_width
      (w <= board_width && h <= board_height) || 
      (can_rotate? && h <= board_width && w <= board_height)
    end
    
    def to_h
      {
        name: @name,
        width: @width,
        height: @height,
        thickness: @thickness,
        material: @material,
        grain_direction: @grain_direction,
        area: area,
        x: @x,
        y: @y,
        rotated: @rotated
      }
    end
  end
end