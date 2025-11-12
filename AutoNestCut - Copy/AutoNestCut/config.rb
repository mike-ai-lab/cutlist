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
        
        if key == 'stock_materials'
          # Load from database first, then merge with saved settings
          database_materials = MaterialsDatabase.load_database
          saved_materials = read_value.is_a?(Hash) ? read_value : {}
          
          # Convert old array format if needed
          saved_materials = saved_materials.transform_values do |dims|
            if dims.is_a?(Array)
              { 'width' => dims[0].to_f, 'height' => dims[1].to_f, 'price' => 0 }
            else
              dims
            end
          end
          
          # Merge database with saved settings (saved settings take priority)
          settings[key] = database_materials.merge(saved_materials)
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
    
    # Cache for loaded settings to avoid repeated database access
    @cached_settings = nil
    @material_cache = {}
    
    def self.get_cached_settings
      @cached_settings ||= load_settings
    end
    
    def self.get_material_from_component_definition(component_definition, selected_entities = nil)
      # Use cache to avoid repeated lookups
      cache_key = component_definition.entityID
      return @material_cache[cache_key] if @material_cache[cache_key]
      
      material = nil
      
      # 1. Try custom attribute first
      if component_definition.attribute_dictionaries && component_definition.attribute_dictionaries['AutoNestCut']
        material = component_definition.attribute_dictionaries['AutoNestCut']['Material']
        if material && !material.empty?
          @material_cache[cache_key] = material.to_s
          return material.to_s
        end
      end
      
      # 2. Check component instance material
      if selected_entities
        selected_entities.each do |entity|
          if entity.is_a?(Sketchup::ComponentInstance) && entity.definition == component_definition
            if entity.material
              material_name = entity.material.display_name || entity.material.name
              @material_cache[cache_key] = material_name
              return material_name
            end
          end
        end
      end
      
      # 3. Check faces inside component definition for material
      component_definition.entities.each do |entity|
        if entity.is_a?(Sketchup::Face) && entity.material
          material_name = entity.material.display_name || entity.material.name
          @material_cache[cache_key] = material_name
          return material_name
        end
      end
      
      # 4. Use component name as material ONLY if it looks like a material name
      if component_definition.name && !component_definition.name.empty?
        name = component_definition.name.to_s
        # Check if name contains common material keywords
        material_keywords = ['wood', 'plywood', 'mdf', 'oak', 'pine', 'maple', 'birch', 'cherry', 'walnut', 'mahogany', 'granite', 'marble', 'chestnut']
        if material_keywords.any? { |keyword| name.downcase.include?(keyword) }
          @material_cache[cache_key] = name
          return name
        end
      end

      # 5. Default fallback - use generic material name
      @material_cache[cache_key] = 'Sheet_Material'
      'Sheet_Material'
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
    
    def self.clear_cache
      @cached_settings = nil
      @material_cache = {}
    end
    
    def self.find_stock_material_match(material_name)
      material_lower = material_name.to_s.downcase
      get_cached_settings['stock_materials'].keys.each do |stock_material|
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