module AutoNestCut
  class ModelAnalyzer

    def extract_parts_from_selection(selection)
      definition_counts = {}
      @selected_entities = selection.to_a
      @original_components = []

      selection.each do |entity|
        count_component_instances(entity, definition_counts)
        collect_original_components(entity)
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

    def get_original_components_data
      @original_components || []
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

    def collect_original_components(entity, transformation = Geom::Transformation.new)
      if entity.is_a?(Sketchup::ComponentInstance)
        bounds = entity.definition.bounds
        if Util.is_sheet_good?(bounds)
          combined_transform = transformation * entity.transformation
          
          @original_components << {
            name: entity.definition.name,
            width: (bounds.width * 25.4).round(2),
            height: (bounds.height * 25.4).round(2), 
            depth: (bounds.depth * 25.4).round(2),
            position: {
              x: (combined_transform.origin.x * 25.4).round(2),
              y: (combined_transform.origin.y * 25.4).round(2),
              z: (combined_transform.origin.z * 25.4).round(2)
            },
            rotation: {
              x: Math.atan2(combined_transform.yaxis.z, combined_transform.zaxis.z),
              y: Math.atan2(-combined_transform.xaxis.z, Math.sqrt(combined_transform.yaxis.z**2 + combined_transform.zaxis.z**2)),
              z: Math.atan2(combined_transform.xaxis.y, combined_transform.xaxis.x)
            },
            material: Config.get_material_from_definition(entity.definition)
          }
        end
      elsif entity.is_a?(Sketchup::Group)
        group_transform = transformation * entity.transformation
        entity.entities.each { |child| collect_original_components(child, group_transform) }
      end
    end
  end
end