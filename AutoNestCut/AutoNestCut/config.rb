module AutoNestCut
  module Config
    
    DEFAULT_SETTINGS = {
      'kerf_width' => 3.0,
      'allow_rotation' => true,
      'stock_materials' => {
        'Plywood_19mm' => [2440, 1220],
        'Plywood_12mm' => [2440, 1220],
        'MDF_16mm' => [2800, 2070],
        'MDF_19mm' => [2800, 2070]
      }
    }
    
    def self.load_settings
      settings = {}
      DEFAULT_SETTINGS.each do |key, value|
        settings[key] = Sketchup.read_default('AutoNestCut', key, value)
      end
      settings
    end
    
    def self.save_settings(settings)
      settings.each do |key, value|
        Sketchup.write_default('AutoNestCut', key, value)
      end
    end
    
    def self.get_material_from_component(component)
      # Try custom attribute first
      if component.attribute_dictionaries && component.attribute_dictionaries['AutoNestCut']
        material = component.attribute_dictionaries['AutoNestCut']['Material']
        return material if material
      end
      
      # Try component name
      name = component.definition.name
      DEFAULT_SETTINGS['stock_materials'].keys.each do |material_name|
        return material_name if name.include?(material_name)
      end
      
      # Default material
      'Plywood_19mm'
    end
    
    def self.get_grain_direction(component)
      if component.attribute_dictionaries && component.attribute_dictionaries['AutoNestCut']
        return component.attribute_dictionaries['AutoNestCut']['GrainDirection']
      end
      nil
    end
  end
end