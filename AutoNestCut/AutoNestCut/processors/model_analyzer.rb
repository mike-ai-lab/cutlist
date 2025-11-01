module AutoNestCut
  class ModelAnalyzer

    def extract_parts_from_selection(selection)
      definition_counts = {}
      @selected_entities = selection.to_a  # Store selection for material lookup

      selection.each do |entity|
        count_component_instances(entity, definition_counts)
      end

      part_types_by_material = {}

      definition_counts.each do |definition, total_count_for_type|
        if Util.is_sheet_good?(definition.bounds)
          part_type = Part.new(definition, @selected_entities)
          material = part_type.material
          puts "Part: #{part_type.name} -> Material: #{material}"
          part_types_by_material[material] ||= []
          part_types_by_material[material] << { part_type: part_type, total_quantity: total_count_for_type }
        end
      end

      part_types_by_material
    end

    private

    def count_component_instances(entity, definition_counts)
      if entity.is_a?(Sketchup::ComponentInstance)
        definition_counts[entity.definition] ||= 0
        definition_counts[entity.definition] += 1
      elsif entity.is_a?(Sketchup::Group)
        entity.entities.each { |child_entity| count_component_instances(child_entity, definition_counts) }
      end
    end
  end
end