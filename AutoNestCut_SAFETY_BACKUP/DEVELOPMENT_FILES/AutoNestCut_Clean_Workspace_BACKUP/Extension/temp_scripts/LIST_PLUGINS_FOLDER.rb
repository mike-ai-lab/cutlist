# ========================================
# List SketchUp Plugins Folder Contents
# ========================================

puts "📁 SketchUp Plugins Folder Contents"
puts "===================================="

plugins_dir = File.join(ENV['APPDATA'], 'SketchUp', 'SketchUp 2025', 'SketchUp', 'Plugins')
puts "📍 Location: #{plugins_dir}"
puts ""

unless Dir.exist?(plugins_dir)
  puts "❌ Plugins directory not found!"
  return
end

# List all items with details
items = Dir.entries(plugins_dir).reject { |f| f == '.' || f == '..' }

puts "📊 Total items: #{items.length}"
puts ""

# Separate files and directories
files = []
directories = []

items.each do |item|
  full_path = File.join(plugins_dir, item)
  if File.directory?(full_path)
    directories << item
  else
    files << item
  end
end

# Show directories first
puts "🗂️  DIRECTORIES (#{directories.length}):"
directories.sort.each do |dir|
  dir_path = File.join(plugins_dir, dir)
  
  # Count items in directory
  begin
    sub_items = Dir.entries(dir_path).reject { |f| f == '.' || f == '..' }
    item_count = sub_items.length
    
    # Check if it might be AutoNestCut related
    is_suspect = dir.downcase.include?('autonest') || 
                 dir.downcase.include?('auto_nest') ||
                 ['lib', 'vendor', 'utils', 'ui', 'models', 'processors', 'exporters'].include?(dir.downcase)
    
    marker = is_suspect ? "🚨" : "📁"
    puts "   #{marker} #{dir}/ (#{item_count} items)"
    
    # Show some contents if suspect
    if is_suspect && item_count > 0
      sub_items.first(3).each do |sub_item|
        puts "      └── #{sub_item}"
      end
      puts "      └── ..." if item_count > 3
    end
  rescue
    puts "   📁 #{dir}/ (access error)"
  end
end

puts ""

# Show files
puts "📄 FILES (#{files.length}):"
files.sort.each do |file|
  file_path = File.join(plugins_dir, file)
  
  # Check if it might be AutoNestCut related
  is_suspect = file.downcase.include?('autonest') || 
               file.downcase.include?('auto_nest') ||
               file.downcase.include?('loader') ||
               file.downcase.include?('main')
  
  # Get file size
  begin
    size = File.size(file_path)
    size_str = size < 1024 ? "#{size}B" : "#{(size/1024.0).round(1)}KB"
  rescue
    size_str = "unknown"
  end
  
  marker = is_suspect ? "🚨" : "📄"
  puts "   #{marker} #{file} (#{size_str})"
  
  # Check file content if suspect and small
  if is_suspect && size < 1000
    begin
      content = File.read(file_path, 100)
      if content.include?('AutoNestCut')
        puts "      └── Contains 'AutoNestCut' reference"
      end
    rescue
    end
  end
end

puts ""
puts "🚨 = Potentially AutoNestCut related"
puts "📁/📄 = Regular SketchUp files"
puts ""
puts "🎯 If you see 🚨 items, run EMERGENCY_CLEANUP.rb"