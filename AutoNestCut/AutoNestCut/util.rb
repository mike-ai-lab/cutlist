module AutoNestCut
  module Util
    
    def self.to_mm(length)
      length.to_mm
    end
    
    def self.from_mm(mm)
      mm.mm
    end
    
    def self.format_dimension(value_mm)
      "#{value_mm.round(1)}mm"
    end
    
    def self.get_dimensions(bounds)
      [bounds.width.to_mm, bounds.height.to_mm, bounds.depth.to_mm]
    end
    
    def self.is_sheet_good?(bounds, min_thickness = 3, max_thickness = 50, min_area = 10000)
      dimensions = get_dimensions(bounds).sort
      thickness = dimensions[0]
      width = dimensions[1]
      height = dimensions[2]
      
      return false if thickness < min_thickness || thickness > max_thickness
      return false if (width * height) < min_area
      
      true
    end
    
    def self.generate_part_id(name, index)
      clean_name = name.gsub(/[^a-zA-Z0-9]/, '_')
      "#{clean_name}_#{index}"
    end
    
    def self.safe_json(obj)
      begin
        obj.to_json
      rescue
        "{}"
      end
    end
  end
end