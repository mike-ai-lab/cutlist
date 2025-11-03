require 'csv'

module AutoNestCut
  class MaterialsDatabase
    
    def self.database_file
      File.join(ENV['APPDATA'] || ENV['HOME'], 'AutoNestCut', 'materials_database.csv')
    end
    
    def self.ensure_database_folder
      folder = File.dirname(database_file)
      Dir.mkdir(folder) unless Dir.exist?(folder)
    end
    
    def self.load_database
      ensure_database_folder
      return {} unless File.exist?(database_file)
      
      materials = {}
      CSV.foreach(database_file, headers: true) do |row|
        materials[row['name']] = {
          'width' => row['width'].to_f,
          'height' => row['height'].to_f,
          'price' => row['price'].to_f,
          'supplier' => row['supplier'] || '',
          'notes' => row['notes'] || ''
        }
      end
      materials
    rescue => e
      Util.debug("Error loading materials database: #{e.message}")
      {}
    end
    
    def self.save_database(materials)
      ensure_database_folder
      CSV.open(database_file, 'w') do |csv|
        csv << ['name', 'width', 'height', 'price', 'supplier', 'notes']
        materials.each do |name, data|
          csv << [
            name,
            data['width'] || 2440,
            data['height'] || 1220,
            data['price'] || 0,
            data['supplier'] || '',
            data['notes'] || ''
          ]
        end
      end
    rescue => e
      Util.debug("Error saving materials database: #{e.message}")
    end
    
    def self.import_csv(file_path)
      return {} unless File.exist?(file_path)
      
      materials = {}
      CSV.foreach(file_path, headers: true) do |row|
        name = row['name'] || row['material'] || row['Material']
        next unless name
        
        materials[name] = {
          'width' => (row['width'] || row['Width'] || 2440).to_f,
          'height' => (row['height'] || row['Height'] || 1220).to_f,
          'price' => (row['price'] || row['Price'] || 0).to_f,
          'supplier' => row['supplier'] || row['Supplier'] || '',
          'notes' => row['notes'] || row['Notes'] || ''
        }
      end
      materials
    rescue => e
      Util.debug("Error importing CSV: #{e.message}")
      {}
    end
    
    def self.get_default_materials
      {
        'Plywood_19mm' => { 'width' => 2440, 'height' => 1220, 'price' => 45, 'supplier' => 'Local Supplier', 'notes' => '19mm Birch Plywood' },
        'Plywood_12mm' => { 'width' => 2440, 'height' => 1220, 'price' => 35, 'supplier' => 'Local Supplier', 'notes' => '12mm Birch Plywood' },
        'MDF_16mm' => { 'width' => 2800, 'height' => 2070, 'price' => 25, 'supplier' => 'Local Supplier', 'notes' => '16mm MDF Board' },
        'MDF_19mm' => { 'width' => 2800, 'height' => 2070, 'price' => 30, 'supplier' => 'Local Supplier', 'notes' => '19mm MDF Board' },
        'Oak_Veneer' => { 'width' => 2440, 'height' => 1220, 'price' => 85, 'supplier' => 'Hardwood Supplier', 'notes' => 'Oak Veneer on MDF' },
        'Melamine_White' => { 'width' => 2800, 'height' => 2070, 'price' => 40, 'supplier' => 'Local Supplier', 'notes' => 'White Melamine Board' }
      }
    end
    
  end
end