require 'csv'

module AutoNestCut
  class ReportGenerator

    def generate_report_data(boards)
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
          stock_size: "#{board.stock_width.round(1)}mm x #{board.stock_height.round(1)}mm",
          parts_count: board.parts_on_board.length,
          used_area: board.used_area.round(2),
          waste_area: board.waste_area.round(2),
          waste_percentage: board.calculate_waste_percentage,
          efficiency: board.efficiency_percentage
        }
        boards_summary << board_info

        # Track unique board types
        board_key = "#{board.material}_#{board.stock_width.round(1)}x#{board.stock_height.round(1)}"
        unique_board_types[board_key] ||= {
          material: board.material,
          dimensions: "#{board.stock_width.round(1)} x #{board.stock_height.round(1)}mm",
          count: 0,
          total_area: 0.0
        }
        unique_board_types[board_key][:count] += 1
        unique_board_types[board_key][:total_area] += board.total_area

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
            area: part_instance.area.round(2),
            board_number: board_number,
            position_x: part_instance.x.round(2),
            position_y: part_instance.y.round(2),
            rotated: part_instance.rotated ? "Yes" : "No",
            grain_direction: part_instance.grain_direction || "Any"
          }

          unique_part_types_summary[part_instance.name] ||= {
            name: part_instance.name,
            width: part_instance.width.round(2),
            height: part_instance.height.round(2),
            thickness: part_instance.thickness.round(2),
            material: part_instance.material,
            grain_direction: part_instance.grain_direction || "Any",
            total_quantity: 0,
            total_area: 0.0
          }
          unique_part_types_summary[part_instance.name][:total_quantity] += 1
          unique_part_types_summary[part_instance.name][:total_area] += part_instance.area
        end
      end

      overall_waste_percentage = overall_total_stock_area > 0 ? (total_waste_area.to_f / overall_total_stock_area * 100).round(2) : 0

      {
        parts_placed: parts_placed_on_boards,
        unique_part_types: unique_part_types_summary.values.sort_by { |p| p[:name] },
        unique_board_types: unique_board_types.values.sort_by { |b| b[:material] },
        boards: boards_summary,
        summary: {
          total_parts_instances: parts_placed_on_boards.length,
          total_unique_part_types: unique_part_types_summary.keys.length,
          total_boards: boards.length,
          total_stock_area: overall_total_stock_area.round(2),
          total_used_area: (overall_total_stock_area - total_waste_area).round(2),
          total_waste_area: total_waste_area.round(2),
          overall_waste_percentage: overall_waste_percentage,
          overall_efficiency: (100.0 - overall_waste_percentage).round(2)
        }
      }
    end

    def export_csv(filename, report_data)
      CSV.open(filename, 'w') do |csv|
        csv << ["UNIQUE PART TYPES SUMMARY"]
        csv << ["Name", "Width(mm)", "Height(mm)", "Thickness(mm)", "Material", "Grain Direction", "Total Quantity", "Total Area(mm²)"]
        report_data[:unique_part_types].each do |part_type|
          csv << [
            part_type[:name],
            part_type[:width],
            part_type[:height],
            part_type[:thickness],
            part_type[:material],
            part_type[:grain_direction],
            part_type[:total_quantity],
            part_type[:total_area].round(2)
          ]
        end
        csv << []

        csv << ["PARTS PLACED (DETAILED LIST)"]
        csv << ["Unique ID", "Name", "Width(mm)", "Height(mm)", "Thickness(mm)", "Material", "Area(mm²)", "Board#", "X Pos(mm)", "Y Pos(mm)", "Rotated", "Grain Direction"]
        report_data[:parts_placed].each do |part_instance|
          csv << [
            part_instance[:part_unique_id],
            part_instance[:name],
            part_instance[:width],
            part_instance[:height],
            part_instance[:thickness],
            part_instance[:material],
            part_instance[:area],
            part_instance[:board_number],
            part_instance[:position_x],
            part_instance[:position_y],
            part_instance[:rotated],
            part_instance[:grain_direction]
          ]
        end
        csv << []

        csv << ["BOARDS SUMMARY"]
        csv << ["Board#", "Material", "Stock Size", "Parts Count", "Used Area(mm²)", "Waste Area(mm²)", "Waste %", "Efficiency %"]
        report_data[:boards].each do |board|
          csv << [
            board[:board_number],
            board[:material],
            board[:stock_size],
            board[:parts_count],
            board[:used_area],
            board[:waste_area],
            board[:waste_percentage],
            board[:efficiency]
          ]
        end
        csv << []

        summary = report_data[:summary]
        csv << ["OVERALL SUMMARY"]
        csv << ["Total Parts Instances", summary[:total_parts_instances]]
        csv << ["Total Unique Part Types", summary[:total_unique_part_types]]
        csv << ["Total Boards", summary[:total_boards]]
        csv << ["Total Stock Area (mm²)", summary[:total_stock_area]]
        csv << ["Total Used Area (mm²)", summary[:total_used_area]]
        csv << ["Total Waste Area (mm²)", summary[:total_waste_area]]
        csv << ["Overall Waste %", summary[:overall_waste_percentage]]
        csv << ["Overall Efficiency %", summary[:overall_efficiency]]
      end
    end
  end
end