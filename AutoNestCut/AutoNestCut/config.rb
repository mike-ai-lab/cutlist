module AutoNestCut
  module Config
    
    DEFAULT_SETTINGS = {
      'kerf_width' => 3.0,
      'allow_rotation' => true,
      'stock_materials' => {}
    }
    
    def self.load_settings
      settings = {}
      DEFAULT_SETTINGS.each do |key, value|
        read_value = Sketchup.read_default('AutoNestCut', key, value)
        
        if key == 'stock_materials' && read_value.is_a?(Hash)
          # Handle both old array format and new hash format
          settings[key] = read_value.transform_values do |dims|
            if dims.is_a?(Array)
              { 'width' => dims[0].to_f, 'height' => dims[1].to_f, 'price' => 0 }
            else
              dims
            end
          end
        else
          settings[key] = read_value
        end
      end
      settings
    end
    
    def self.save_settings(settings)
      settings.each do |key, value|
        Sketchup.write_default('AutoNestCut', key, value)
      end
    end
    
    def self.get_material_from_definition(component_definition, selected_entities = nil)
      get_material_from_component_definition(component_definition, selected_entities)
    end
    
    def self.get_material_from_component_definition(component_definition, selected_entities = nil)
      # 1. Try custom attribute first
      if component_definition.attribute_dictionaries && component_definition.attribute_dictionaries['AutoNestCut']
        material = component_definition.attribute_dictionaries['AutoNestCut']['Material']
        return material.to_s if material && !material.empty?
      end
      
      # 2. Check if component instances have SketchUp material assigned
      # Search through all entities to find instances of this definition
      def self.find_material_for_definition(component_definition, entities = nil)
        entities ||= Sketchup.active_model.entities
        
        entities.each do |entity|
          if entity.is_a?(Sketchup::ComponentInstance) && entity.definition == component_definition
            if entity.material
              material_name = entity.material.display_name || entity.material.name
              return material_name
            end
          elsif entity.is_a?(Sketchup::Group)
            # Recursively search in groups
            result = find_material_for_definition(component_definition, entity.entities)
            return result if result
          end
        end
        nil
      end
      
      # Check selected entities first if provided
      if selected_entities
        selected_entities.each do |entity|
          if entity.is_a?(Sketchup::ComponentInstance) && entity.definition == component_definition
            if entity.material
              material_name = entity.material.display_name || entity.material.name
              return material_name
            end
          end
        end
      end
      
      # Fallback to searching all entities
      material_from_instance = find_material_for_definition(component_definition)
      return material_from_instance if material_from_instance

      # 3. Try component name matching
      name = component_definition.name.to_s.downcase
      load_settings['stock_materials'].keys.each do |material_key|
        return material_key if name.include?(material_key.downcase)
      end

      # 4. Default fallback - return the material name as-is
      'Unknown_Material'
    end
    
    def self.get_material_texture_data(component_definition, selected_entities = nil)
      # Find material instance
      material = nil
      
      if selected_entities
        selected_entities.each do |entity|
          if entity.is_a?(Sketchup::ComponentInstance) && entity.definition == component_definition
            material = entity.material
            break if material
          end
        end
      end
      
      return nil unless material && material.texture
      
      # Get texture properties
      texture = material.texture
      {
        width: texture.width,
        height: texture.height,
        filename: texture.filename,
        # Note: In a real implementation, you'd need to export the texture image
        # For now, return basic texture info
        scale_x: 1.0,
        scale_y: 1.0
      }
    end
    
    def self.find_stock_material_match(material_name)
      material_lower = material_name.to_s.downcase
      load_settings['stock_materials'].keys.each do |stock_material|
        return stock_material if material_lower.include?(stock_material.downcase) || stock_material.downcase.include?(material_lower)
      end
      nil
    end

    def self.get_grain_direction_from_definition(component_definition)
      # 1. Try custom attribute first
      if component_definition.attribute_dictionaries && component_definition.attribute_dictionaries['AutoNestCut']
        grain = component_definition.attribute_dictionaries['AutoNestCut']['GrainDirection']
        return grain.to_s.downcase if grain && !grain.empty?
      end
      
      # 2. Analyze component dimensions to suggest grain direction
      bounds = component_definition.bounds
      dimensions = [bounds.width.to_mm, bounds.height.to_mm, bounds.depth.to_mm].sort
      thickness = dimensions[0]
      width = dimensions[1]
      height = dimensions[2]
      
      # If one dimension is significantly larger, suggest grain along that direction
      if height > width * 1.5
        return 'vertical'  # Grain runs along height
      elsif width > height * 1.5
        return 'horizontal'  # Grain runs along width
      end
      
      # Default: allow rotation
      'any'
    end
  end
end