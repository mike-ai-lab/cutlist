module AutoNestCut
  class ReportGenerator
    
    def generate_report_data(boards)
      parts_summary = []
      boards_summary = []
      total_waste = 0
      total_area = 0
      
      boards.each_with_index do |board, index|
        # Board summary
        board_info = {
          board_number: index + 1,
          material: board.material,
          stock_size: "#{board.stock_width}mm x #{board.stock_height}mm",
          parts_count: board.parts_on_board.length,
          used_area: board.used_area.round(2),
          waste_area: board.waste_area.round(2),
          waste_percentage: board.calculate_waste_percentage,
          efficiency: board.efficiency_percentage
        }
        boards_summary << board_info
        
        total_waste += board.waste_area
        total_area += board.total_area
        
        # Parts on this board
        board.parts_on_board.each_with_index do |part, part_index|
          part_info = {
            part_number: "P#{parts_summary.length + 1}",
            name: part.name,
            width: part.width.round(2),
            height: part.height.round(2),
            thickness: part.thickness.round(2),
            material: part.material,
            area: part.area.round(2),
            board_number: index + 1,
            position_x: part.x.round(2),
            position_y: part.y.round(2),
            rotated: part.rotated ? "Yes" : "No",
            grain_direction: part.grain_direction || "Any"
          }
          parts_summary << part_info
        end
      end
      
      # Overall summary
      overall_waste_percentage = total_area > 0 ? (total_waste / total_area * 100).round(2) : 0
      
      {
        parts: parts_summary,
        boards: boards_summary,
        summary: {
          total_parts: parts_summary.length,
          total_boards: boards.length,
          total_area: total_area.round(2),
          total_waste: total_waste.round(2),
          overall_waste_percentage: overall_waste_percentage,
          overall_efficiency: (100 - overall_waste_percentage).round(2)
        }
      }
    end
    
    def export_csv(filename, report_data)
      require 'csv'
      
      CSV.open(filename, 'w') do |csv|
        # Parts list
        csv << ["PARTS LIST"]
        csv << ["Part#", "Name", "Width(mm)", "Height(mm)", "Thickness(mm)", "Material", "Area(mm²)", "Board#", "X Position", "Y Position", "Rotated", "Grain Direction"]
        
        report_data[:parts].each do |part|
          csv << [
            part[:part_number],
            part[:name],
            part[:width],
            part[:height], 
            part[:thickness],
            part[:material],
            part[:area],
            part[:board_number],
            part[:position_x],
            part[:position_y],
            part[:rotated],
            part[:grain_direction]
          ]
        end
        
        csv << []
        
        # Boards summary
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
        
        # Overall summary
        summary = report_data[:summary]
        csv << ["OVERALL SUMMARY"]
        csv << ["Total Parts", summary[:total_parts]]
        csv << ["Total Boards", summary[:total_boards]]
        csv << ["Total Area (mm²)", summary[:total_area]]
        csv << ["Total Waste (mm²)", summary[:total_waste]]
        csv << ["Overall Waste %", summary[:overall_waste_percentage]]
        csv << ["Overall Efficiency %", summary[:overall_efficiency]]
      end
    end
  end
end