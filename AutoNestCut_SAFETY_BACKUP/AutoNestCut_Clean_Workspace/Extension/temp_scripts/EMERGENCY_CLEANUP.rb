# ========================================
# EMERGENCY AutoNestCut Cleanup Script
# ========================================
# This will find and remove ALL scattered AutoNestCut files

puts "🚨 EMERGENCY CLEANUP: AutoNestCut Files"
puts "======================================="

# Define plugins directory
plugins_dir = File.join(ENV['APPDATA'], 'SketchUp', 'SketchUp 2025', 'SketchUp', 'Plugins')
puts "🔍 Scanning plugins directory: #{plugins_dir}"

unless Dir.exist?(plugins_dir)
  puts "❌ Plugins directory not found!"
  return
end

# Find all AutoNestCut related files and directories
autonest_files = []
autonest_dirs = []

# Scan for files and directories
Dir.glob(File.join(plugins_dir, "**/*"), File::FNM_DOTMATCH).each do |item|
  next if File.basename(item) == '.' || File.basename(item) == '..'
  
  item_name = File.basename(item).downcase
  item_path = item.downcase
  
  # Check if it's AutoNestCut related
  is_autonest = false
  
  # Direct name matches
  if item_name.include?('autonestcut') || 
     item_name.include?('auto_nest_cut') ||
     item_name.include?('autonest')
    is_autonest = true
  end
  
  # Check file content for AutoNestCut references (for files < 1MB)
  if File.file?(item) && File.size(item) < 1024*1024
    begin
      content = File.read(item, 500) # Read first 500 chars
      if content.include?('AutoNestCut') || 
         content.include?('autonestcut') ||
         content.include?('auto_nest_cut')
        is_autonest = true
      end
    rescue
      # Skip if can't read file
    end
  end
  
  # Check for specific AutoNestCut directories
  if File.directory?(item)
    dir_contents = Dir.entries(item) rescue []
    if dir_contents.any? { |f| f.include?('autonest') || f.include?('AutoNest') }
      is_autonest = true
    end
  end
  
  if is_autonest
    if File.directory?(item)
      autonest_dirs << item
    else
      autonest_files << item
    end
  end
end

# Also check for common scattered directories
common_dirs = ['lib', 'vendor', 'utils', 'ui', 'models', 'processors', 'exporters']
common_dirs.each do |dir_name|
  dir_path = File.join(plugins_dir, dir_name)
  if Dir.exist?(dir_path)
    # Check if this directory contains AutoNestCut files
    has_autonest = false
    Dir.glob(File.join(dir_path, "**/*")).each do |file|
      if File.file?(file)
        begin
          content = File.read(file, 200)
          if content.include?('AutoNestCut')
            has_autonest = true
            break
          end
        rescue
        end
      end
    end
    
    if has_autonest
      autonest_dirs << dir_path unless autonest_dirs.include?(dir_path)
    end
  end
end

# Display findings
puts ""
puts "📊 SCAN RESULTS:"
puts "================"
puts "🗂️  Directories found: #{autonest_dirs.length}"
puts "📄 Files found: #{autonest_files.length}"
puts ""

if autonest_dirs.empty? && autonest_files.empty?
  puts "✅ No AutoNestCut files found in plugins directory!"
  puts "🎉 Plugins folder is clean!"
  return
end

# Show what will be deleted
puts "🗂️  DIRECTORIES TO DELETE:"
autonest_dirs.each { |dir| puts "   📁 #{dir}" }

puts ""
puts "📄 FILES TO DELETE:"
autonest_files.each { |file| puts "   📄 #{file}" }

puts ""
puts "⚠️  WARNING: This will permanently delete these files!"
puts "💾 Make sure you have backups if needed."
puts ""

# Ask for confirmation
result = UI.messagebox(
  "Found #{autonest_files.length} files and #{autonest_dirs.length} directories to delete.\n\nProceed with cleanup?",
  MB_YESNO,
  "AutoNestCut Cleanup"
)

if result == IDNO
  puts "❌ Cleanup cancelled by user"
  return
end

# Perform cleanup
puts "🧹 Starting cleanup..."
deleted_files = 0
deleted_dirs = 0
errors = []

# Delete files first
autonest_files.each do |file|
  begin
    File.delete(file)
    puts "   ✅ Deleted file: #{File.basename(file)}"
    deleted_files += 1
  rescue => e
    puts "   ❌ Failed to delete file: #{file} - #{e.message}"
    errors << "File: #{file} - #{e.message}"
  end
end

# Delete directories (in reverse order to handle nested dirs)
autonest_dirs.sort.reverse.each do |dir|
  begin
    Dir.rmdir(dir)
    puts "   ✅ Deleted directory: #{File.basename(dir)}"
    deleted_dirs += 1
  rescue => e
    # Try to force delete if not empty
    begin
      FileUtils.rm_rf(dir)
      puts "   ✅ Force deleted directory: #{File.basename(dir)}"
      deleted_dirs += 1
    rescue => e2
      puts "   ❌ Failed to delete directory: #{dir} - #{e2.message}"
      errors << "Directory: #{dir} - #{e2.message}"
    end
  end
end

# Summary
puts ""
puts "🏁 CLEANUP COMPLETE!"
puts "==================="
puts "✅ Files deleted: #{deleted_files}"
puts "✅ Directories deleted: #{deleted_dirs}"

if errors.any?
  puts "❌ Errors encountered: #{errors.length}"
  errors.each { |error| puts "   ⚠️  #{error}" }
end

puts ""
puts "🎯 NEXT STEPS:"
puts "1. Restart SketchUp completely"
puts "2. Use the clean extension loader"
puts "3. Load from clean workspace only"
puts ""
puts "✨ Plugins folder should now be clean!"