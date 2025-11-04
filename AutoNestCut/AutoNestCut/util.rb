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
    
    def self.is_sheet_good?(bounds, min_thickness = 3, max_thickness = 100, min_area = 1000)
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

    # Debug helper - controlled by environment variable AUTONESTCUT_DEBUG=1
    def self.debug(msg)
      if ENV['AUTONESTCUT_DEBUG'] == '1'
        begin
          puts "[AutoNestCut] #{msg}"
        rescue
          # best-effort
        end
      end
    end

    # Simple binary PNG signature check. Returns true when path exists and looks like a PNG file.
    def self.png_file?(path)
      return false unless path && File.exist?(path)
      return false unless File.size(path) > 8
      begin
        sig = File.binread(path, 8)
        return sig.start_with?("\x89PNG")
      rescue
        return false
      end
    end
  end
end