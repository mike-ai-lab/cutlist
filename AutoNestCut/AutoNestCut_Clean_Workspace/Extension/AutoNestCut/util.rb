module AutoNestCut
  module Util
    
    # Unit conversion factors (to mm)
    UNIT_FACTORS = {
      'mm' => 1.0,
      'cm' => 10.0,
      'm' => 1000.0,
      'in' => 25.4,
      'ft' => 304.8
    }.freeze
    
    UNIT_LABELS = {
      'mm' => 'mm',
      'cm' => 'cm', 
      'm' => 'm',
      'in' => 'in',
      'ft' => 'ft'
    }.freeze
    
    def self.to_mm(length)
      length.to_mm
    end
    
    def self.from_mm(mm)
      mm.mm
    end
    
    def self.convert_units(value, from_unit, to_unit)
      return value if from_unit == to_unit
      return 0 unless UNIT_FACTORS[from_unit] && UNIT_FACTORS[to_unit]
      
      # Convert to mm first, then to target unit
      value_mm = value * UNIT_FACTORS[from_unit]
      value_mm / UNIT_FACTORS[to_unit]
    end
    
    def self.format_dimension(value_mm, display_unit = nil, precision = 1)
      display_unit ||= Config.get_cached_settings['units'] || 'mm'
      
      converted_value = convert_units(value_mm, 'mm', display_unit)
      unit_label = UNIT_LABELS[display_unit] || display_unit
      
      if precision == 0
        "#{converted_value.round}#{unit_label}"
      else
        "#{converted_value.round(precision)}#{unit_label}"
      end
    end
    
    def self.format_area(area_mm2, display_unit = nil)
      display_unit ||= Config.get_cached_settings['units'] || 'mm'
      
      area_unit = "#{display_unit}2"
      factor = UNIT_FACTORS[display_unit] || 1.0
      converted_area = area_mm2 / (factor * factor)
      
      "#{converted_area.round(3)} #{area_unit}"
    end
    
    def self.get_dimensions(bounds)
      [bounds.width.to_mm, bounds.height.to_mm, bounds.depth.to_mm]
    end
    
    def self.get_dimensions_in_unit(bounds, unit = nil)
      unit ||= Config.get_cached_settings['units'] || 'mm'
      dimensions_mm = get_dimensions(bounds)
      dimensions_mm.map { |dim| convert_units(dim, 'mm', unit) }
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