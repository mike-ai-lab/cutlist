module AutoNestCut
  class Part
    attr_accessor :name, :width, :height, :thickness, :material, :grain_direction
    attr_reader :original_definition
    attr_accessor :x, :y, :rotated, :instance_id

    def initialize(component_definition, selected_entities = nil)
      @original_definition = component_definition
      @name = component_definition.name

      dimensions_mm = Util.get_dimensions(component_definition.bounds).sort
      @thickness = dimensions_mm[0]
      @width = dimensions_mm[1]
      @height = dimensions_mm[2]

      @material = Config.get_material_from_component_definition(component_definition, selected_entities)
      @grain_direction = Config.get_grain_direction_from_definition(component_definition)
      @texture_data = Config.get_material_texture_data(component_definition, selected_entities)

      @x = 0.0
      @y = 0.0
      @rotated = false
      @instance_id = nil
    end

    def create_placed_instance
      placed_part = Part.new(@original_definition)
      placed_part.instance_id = nil
      placed_part.x = 0.0
      placed_part.y = 0.0
      placed_part.rotated = false
      placed_part
    end

    def area
      @width * @height
    end

    def rotate!
      return false if @grain_direction && ['fixed', 'vertical', 'horizontal'].include?(@grain_direction.downcase)
      @width, @height = @height, @width
      @rotated = !@rotated
      true
    end

    def can_rotate?
      return false if @grain_direction && ['fixed', 'vertical', 'horizontal'].include?(@grain_direction.downcase)
      true
    end

    def fits_in?(board_width, board_height, kerf_width = 0)
      w_with_kerf = @width + kerf_width
      h_with_kerf = @height + kerf_width

      return true if w_with_kerf <= board_width && h_with_kerf <= board_height
      if can_rotate?
        return true if h_with_kerf <= board_width && w_with_kerf <= board_height
      end
      false
    end

    def to_h
      {
        name: @name,
        width: @width.round(2),
        height: @height.round(2),
        thickness: @thickness.round(2),
        material: @material,
        grain_direction: @grain_direction,
        area: area.round(2),
        x: @x.round(2),
        y: @y.round(2),
        rotated: @rotated,
        instance_id: @instance_id,
        texture_data: @texture_data
      }
    end
  end
end