require 'set'

module AutoNestCut
  class ModelAnalyzer
    
    def extract_parts_from_selection(selection)
      parts_by_material = {}
      
      selection.each do |entity|
        if entity.is_a?(Sketchup::ComponentInstance) && is_valid_part?(entity)
          part = Part.new(entity)
          material = part.material
          parts_by_material[material] ||= []
          parts_by_material[material] << part
          puts "Added: #{part.name} (#{part.width.round}x#{part.height.round}x#{part.thickness.round}mm)"
        end
      end
      
      puts "Total parts found: #{parts_by_material.values.flatten.length}"
      parts_by_material
    end
    
    private
    
    def extract_parts_from_entity(entity, parts_by_material, processed_instances)
      if entity.is_a?(Sketchup::ComponentInstance)
        instance_id = entity.entityID
        unless processed_instances.include?(instance_id)
          process_component_instance(entity, parts_by_material)
          processed_instances.add(instance_id)
        end
      elsif entity.is_a?(Sketchup::Group)
        entity.entities.each do |child_entity|
          extract_parts_from_entity(child_entity, parts_by_material, processed_instances)
        end
      end
    end
    
    def process_component_instance(instance, parts_by_material)
      return unless is_valid_part?(instance)
      
      part = Part.new(instance)
      material = part.material
      
      parts_by_material[material] ||= []
      parts_by_material[material] << part
      puts "Added: #{part.name} (#{part.width.round}x#{part.height.round}x#{part.thickness.round}mm)"
    end
    
    def is_valid_part?(instance)
      true
    end
  end
end