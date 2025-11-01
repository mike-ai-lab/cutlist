module AutoNestCut
  module Util
    
    # Convert SketchUp units to millimeters
    def self.to_mm(length)
      length.to_mm
    end
    
    # Convert millimeters to SketchUp units
    def self.from_mm(mm)
      mm.mm
    end
    
    # Format dimension for display
    def self.format_dimension(value_mm)
      "#{value_mm.round(1)}mm"
    end
    
    # Calculate bounding box dimensions
    def self.get_dimensions(bounds)
      [bounds.width, bounds.height, bounds.depth].map { |d| to_mm(d) }
    end
    
    # Check if component is likely a sheet good part
    def self.is_sheet_good?(bounds, min_thickness = 3, max_thickness = 50, min_area = 10000)
      dimensions = get_dimensions(bounds).sort
      thickness = dimensions[0]
      width = dimensions[1]
      height = dimensions[2]
      
      return false if thickness < min_thickness || thickness > max_thickness
      return false if (width * height) < min_area
      
      true
    end
    
    # Generate unique part ID
    def self.generate_part_id(name, index)
      clean_name = name.gsub(/[^a-zA-Z0-9]/, '_')
      "#{clean_name}_#{index}"
    end
    
    # Safe JSON conversion
    def self.safe_json(obj)
      begin
        obj.to_json
      rescue
        "{}"
      end
    end
  end
end