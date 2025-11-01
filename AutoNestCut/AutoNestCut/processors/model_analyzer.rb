module AutoNestCut
  class ModelAnalyzer
    
    def extract_parts_from_selection(selection)
      parts_by_material = {}
      
      selection.each do |entity|
        extract_parts_from_entity(entity, parts_by_material)
      end
      
      parts_by_material
    end
    
    private
    
    def extract_parts_from_entity(entity, parts_by_material)
      if entity.is_a?(Sketchup::ComponentInstance)
        process_component_instance(entity, parts_by_material)
      elsif entity.is_a?(Sketchup::Group)
        # Recursively process group contents
        entity.entities.each do |child_entity|
          extract_parts_from_entity(child_entity, parts_by_material)
        end
      end
    end
    
    def process_component_instance(instance, parts_by_material)
      puts "Processing: #{instance.definition.name}"
      
      # Check if this is a valid part (sheet good)
      unless is_valid_part?(instance)
        puts "  Invalid part - skipping"
        return
      end
      
      part = Part.new(instance)
      material = part.material
      puts "  Added part: #{part.name} - #{material}"
      
      parts_by_material[material] ||= []
      parts_by_material[material] << part
    end
    
    def is_valid_part?(instance)
      true
    end
  end
end