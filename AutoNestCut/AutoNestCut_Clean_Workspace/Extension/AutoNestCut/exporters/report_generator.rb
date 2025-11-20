require 'csv'

module AutoNestCut
  class ReportGenerator

    def generate_report_data(boards, settings = {})
      puts "DEBUG: ReportGenerator.generate_report_data called with #{boards.length} boards"
      
      # Get current global settings
      current_settings = Config.get_cached_settings
      currency = current_settings['default_currency'] || settings['default_currency'] || 'USD'
      units = current_settings['units'] || settings['units'] || 'mm'
      precision = current_settings['precision'] || settings['precision'] || 1
      
      puts "DEBUG: Report settings - currency: #{currency}, units: #{units}, precision: #{precision}"
      
      # Keep all data in mm, let frontend handle display conversion
      parts_placed_on_boards = []
      unique_part_types_summary = {}

      boards_summary = []
      unique_board_types = {}
      total_waste_area = 0
      overall_total_stock_area = 0

      global_part_instance_counter = 1

      boards.each_with_index do |board, board_idx|
        board_number = board_idx + 1
        board_info = {
          board_number: board_number,
          material: board.material,
          stock_size_mm: "#{board.stock_width.round(1)} x #{board.stock_height.round(1)} mm",
          stock_width: board.stock_width,
          stock_height: board.stock_height,
          parts_count: board.parts_on_board.length,
          used_area: board.used_area,
          waste_area: board.waste_area,
          waste_percentage: board.calculate_waste_percentage,
          efficiency: board.efficiency_percentage,
          units: units,
          precision: precision
        }
        boards_summary << board_info

        # Track unique board types
        board_key = "#{board.material}_#{board.stock_width.round(1)}x#{board.stock_height.round(1)}"
        unique_board_types[board_key] ||= {
          material: board.material,
          dimensions_mm: "#{board.stock_width.round(1)} x #{board.stock_height.round(1)} mm",
          stock_width: board.stock_width,
          stock_height: board.stock_height,
          count: 0,
          total_area: 0.0,
          units: units
        }
        unique_board_types[board_key][:count] += 1
        unique_board_types[board_key][:total_area] += board.total_area
        
        # Add pricing calculation with currency
        stock_materials = settings['stock_materials'] || {}
        material_info = stock_materials[board.material]
        if material_info && material_info.is_a?(Hash)
          price = material_info['price'] || 0
          material_currency = material_info['currency'] || currency
          unique_board_types[board_key][:price_per_sheet] = price
          unique_board_types[board_key][:currency] = material_currency
          unique_board_types[board_key][:total_cost] = unique_board_types[board_key][:count] * price
        else
          unique_board_types[board_key][:price_per_sheet] = 0
          unique_board_types[board_key][:currency] = currency
          unique_board_types[board_key][:total_cost] = 0
        end

        total_waste_area += board.waste_area
        overall_total_stock_area += board.total_area

        board.parts_on_board.each do |part_instance|
          part_instance.instance_id = "P#{global_part_instance_counter}"
          global_part_instance_counter += 1

          parts_placed_on_boards << {
            part_unique_id: part_instance.instance_id,
            name: part_instance.name,
            width: part_instance.width.round(2),
            height: part_instance.height.round(2),
            thickness: part_instance.thickness.round(2),
            material: part_instance.material,
            area: part_instance.area.round(precision),
            board_number: board_number,
            position_x: part_instance.x.round(2),
            position_y: part_instance.y.round(2),
            rotated: part_instance.rotated ? "Yes" : "No",
            grain_direction: part_instance.grain_direction || "Any",
            units: units
          }

          unique_part_types_summary[part_instance.name] ||= {
            name: part_instance.name,
            width: part_instance.width.round(2),
            height: part_instance.height.round(2),
            thickness: part_instance.thickness.round(2),
            material: part_instance.material,
            grain_direction: part_instance.grain_direction || "Any",
            total_quantity: 0,
            total_area: 0.0,
            units: units
          }
          unique_part_types_summary[part_instance.name][:total_quantity] += 1
          unique_part_types_summary[part_instance.name][:total_area] += part_instance.area
        end
      end

      overall_waste_percentage = overall_total_stock_area > 0 ? (total_waste_area.to_f / overall_total_stock_area * 100).round(2) : 0
      
      # Calculate total project cost
      total_project_cost = unique_board_types.values.sum { |board| board[:total_cost] || 0 }

      report_data = {
        parts_placed: parts_placed_on_boards,
        unique_part_types: unique_part_types_summary.values.sort_by { |p| p[:name] },
        unique_board_types: unique_board_types.values.sort_by { |b| b[:material] },
        boards: boards_summary,
        summary: {
          total_parts_instances: parts_placed_on_boards.length,
          total_unique_part_types: unique_part_types_summary.keys.length,
          total_boards: boards.length,
          total_stock_area: overall_total_stock_area.round(precision),
          total_used_area: (overall_total_stock_area - total_waste_area).round(precision),
          total_waste_area: total_waste_area.round(precision),
          overall_waste_percentage: overall_waste_percentage,
          overall_efficiency: (100.0 - overall_waste_percentage),
          total_project_cost: total_project_cost.round(2),
          currency: currency,
          units: units,
          precision: precision
        }
      }
      
      puts "DEBUG: Generated report data:"
      puts "  - Parts placed: #{parts_placed_on_boards.length}"
      puts "  - Unique part types: #{unique_part_types_summary.keys.length}"
      puts "  - Boards: #{boards.length}"
      puts "  - Total project cost: #{total_project_cost}"
      
      report_data
    end
    
    def get_unit_factor(units)
      case units
      when 'mm'
        1.0
      when 'cm'
        10.0
      when 'in'
        25.4
      when 'ft'
        304.8
      else
        1.0
      end
    end

    def export_csv(filename, report_data)
      CSV.open(filename, 'w') do |csv|
        csv << ["UNIQUE PART TYPES SUMMARY"]
        csv << ["Name", "Width(mm)", "Height(mm)", "Thickness(mm)", "Material", "Grain Direction", "Total Quantity", "Total Area(mm²)"]
        (report_data[:unique_part_types] || []).each do |part_type|
          csv << [
            part_type[:name].to_s,
            (part_type[:width] || 0).to_f,
            (part_type[:height] || 0).to_f,
            (part_type[:thickness] || 0).to_f,
            part_type[:material].to_s,
            part_type[:grain_direction].to_s,
            (part_type[:total_quantity] || 0).to_i,
            (part_type[:total_area] || 0).to_f.round(2)
          ]
        end
        csv << []

        csv << ["PARTS PLACED (DETAILED LIST)"]
        csv << ["Unique ID", "Name", "Width(mm)", "Height(mm)", "Thickness(mm)", "Material", "Area(mm²)", "Board#", "X Pos(mm)", "Y Pos(mm)", "Rotated", "Grain Direction"]
        (report_data[:parts_placed] || []).each do |part_instance|
          csv << [
            part_instance[:part_unique_id].to_s,
            part_instance[:name].to_s,
            (part_instance[:width] || 0).to_f,
            (part_instance[:height] || 0).to_f,
            (part_instance[:thickness] || 0).to_f,
            part_instance[:material].to_s,
            (part_instance[:area] || 0).to_f,
            (part_instance[:board_number] || 0).to_i,
            (part_instance[:position_x] || 0).to_f,
            (part_instance[:position_y] || 0).to_f,
            part_instance[:rotated].to_s,
            part_instance[:grain_direction].to_s
          ]
        end
        csv << []

        csv << ["BOARDS SUMMARY"]
        csv << ["Board#", "Material", "Stock Size", "Parts Count", "Used Area(mm²)", "Waste Area(mm²)", "Waste %", "Efficiency %"]
        (report_data[:boards] || []).each do |board|
          csv << [
            (board[:board_number] || 0).to_i,
            board[:material].to_s,
            board[:stock_size].to_s,
            (board[:parts_count] || 0).to_i,
            (board[:used_area] || 0).to_f,
            (board[:waste_area] || 0).to_f,
            (board[:waste_percentage] || 0).to_f,
            (board[:efficiency] || 0).to_f
          ]
        end
        csv << []

        summary = report_data[:summary] || {}
        csv << ["OVERALL SUMMARY"]
        csv << ["Total Parts Instances", (summary[:total_parts_instances] || 0).to_i]
        csv << ["Total Unique Part Types", (summary[:total_unique_part_types] || 0).to_i]
        csv << ["Total Boards", (summary[:total_boards] || 0).to_i]
        csv << ["Total Stock Area (mm²)", (summary[:total_stock_area] || 0).to_f]
        csv << ["Total Used Area (mm²)", (summary[:total_used_area] || 0).to_f]
        csv << ["Total Waste Area (mm²)", (summary[:total_waste_area] || 0).to_f]
        csv << ["Overall Waste %", (summary[:overall_waste_percentage] || 0).to_f]
        csv << ["Overall Efficiency %", (summary[:overall_efficiency] || 0).to_f]
      end
    end
  end
end