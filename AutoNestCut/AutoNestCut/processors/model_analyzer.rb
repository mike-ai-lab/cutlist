require 'set'

module AutoNestCut
  class ModelAnalyzer

    def extract_parts_from_selection(selection)
      definition_counts = {}
      @selected_entities = selection.to_a
      @original_components = []
      @hierarchy_tree = []
      @processed_entities = Set.new

      # Build hierarchy tree first
      selection.each do |entity|
        tree_node = build_simple_tree(entity, 0)
        if tree_node
          @hierarchy_tree << tree_node
          Util.debug("Added tree node: #{tree_node[:name]} (#{tree_node[:type]})")
        end
      end
      Util.debug("Total hierarchy nodes: #{@hierarchy_tree.length}")
      
      # AGGRESSIVE RECURSIVE SEARCH through ALL levels
      selection.each do |entity|
        deep_recursive_search(entity, definition_counts, Geom::Transformation.new)
      end

      part_types_by_material = {}

      # Process only sheet goods and batch create parts
      definition_counts.each do |definition, total_count_for_type|
        if Util.is_sheet_good?(definition.bounds)
          part_type = Part.new(definition, @selected_entities)
          material = part_type.material
          part_types_by_material[material] ||= []
          part_types_by_material[material] << { part_type: part_type, total_quantity: total_count_for_type }
        end
      end

      part_types_by_material
    end

    def get_original_components_data
      @original_components || []
    end
    
    def get_hierarchy_tree
      @hierarchy_tree || []
    end

    private

    # AGGRESSIVE DEEP RECURSIVE SEARCH - Goes through ALL nesting levels
    def deep_recursive_search(entity, definition_counts, transformation = Geom::Transformation.new)
      # Prevent infinite loops
      return if @processed_entities.include?(entity.entityID)
      @processed_entities.add(entity.entityID)
      
      if entity.is_a?(Sketchup::ComponentInstance)
        # Count instances
        definition_counts[entity.definition] ||= 0
        definition_counts[entity.definition] += 1
        
        # Collect original components (only for sheet goods)
        bounds = entity.definition.bounds
        if Util.is_sheet_good?(bounds)
          combined_transform = transformation * entity.transformation
          
          @original_components << {
            name: entity.definition.name,
            entity_id: entity.entityID,
            definition_id: entity.definition.entityID,
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
            material: Config.get_material_from_definition(entity.definition, @selected_entities)
          }
        end
        
        # SEARCH INSIDE COMPONENT DEFINITION
        component_transform = transformation * entity.transformation
        entity.definition.entities.each { |child| deep_recursive_search(child, definition_counts, component_transform) }
        
      elsif entity.is_a?(Sketchup::Group)
        # SEARCH INSIDE GROUP
        group_transform = transformation * entity.transformation
        entity.entities.each { |child| deep_recursive_search(child, definition_counts, group_transform) }
        
      elsif entity.is_a?(Sketchup::Face) || entity.is_a?(Sketchup::Edge)
        # Skip geometry - we only want components
        return
      end
    end
    
    # Simple tree builder that always creates nodes
    def build_simple_tree(entity, level)
      if entity.is_a?(Sketchup::ComponentInstance)
        {
          type: 'component',
          name: entity.definition.name || 'Unnamed Component',
          level: level,
          material: Config.get_material_from_definition(entity.definition, @selected_entities),
          dimensions: get_component_dimensions(entity.definition),
          children: []
        }
      elsif entity.is_a?(Sketchup::Group)
        children = []
        entity.entities.each do |child|
          if child.is_a?(Sketchup::ComponentInstance) || child.is_a?(Sketchup::Group)
            child_node = build_simple_tree(child, level + 1)
            children << child_node if child_node
          end
        end
        
        {
          type: 'group',
          name: entity.name || "Group_#{entity.entityID}",
          level: level,
          material: 'Container',
          dimensions: '',
          children: children
        }
      end
    end
    
    def get_component_dimensions(definition)
      bounds = definition.bounds
      "#{(bounds.width * 25.4).round(1)}×#{(bounds.height * 25.4).round(1)}×#{(bounds.depth * 25.4).round(1)}mm"
    end
    
    # Build actual hierarchy tree structure
    def build_hierarchy_tree(entity, level)
      if entity.is_a?(Sketchup::ComponentInstance)
        children = []
        entity.definition.entities.each do |child|
          child_node = build_hierarchy_tree(child, level + 1)
          children << child_node if child_node
        end
        
        bounds = entity.definition.bounds
        if Util.is_sheet_good?(bounds)
          {
            type: 'component',
            name: entity.definition.name || 'Unnamed Component',
            level: level,
            material: Config.get_material_from_definition(entity.definition, @selected_entities),
            dimensions: "#{(bounds.width * 25.4).round(1)}×#{(bounds.height * 25.4).round(1)}×#{(bounds.depth * 25.4).round(1)}mm",
            children: children
          }
        elsif children.any?
          {
            type: 'component',
            name: entity.definition.name || 'Assembly',
            level: level,
            material: 'Assembly',
            dimensions: '',
            children: children
          }
        else
          nil
        end
      elsif entity.is_a?(Sketchup::Group)
        children = []
        entity.entities.each do |child|
          child_node = build_hierarchy_tree(child, level + 1)
          children << child_node if child_node
        end
        
        {
          type: 'group',
          name: entity.name || "Group_#{entity.entityID}",
          level: level,
          material: 'Container',
          dimensions: '',
          children: children
        }
      else
        nil
      end
    end
  end
end