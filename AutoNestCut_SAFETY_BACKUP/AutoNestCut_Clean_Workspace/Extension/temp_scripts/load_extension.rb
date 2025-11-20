# ========================================
# AutoNestCut Extension Loader - COMPLETE
# ========================================
# Copy and paste this ENTIRE script into SketchUp Ruby Console
# This will load the extension with proper cache clearing

puts "🚀 Starting AutoNestCut Extension Load Process..."

# 1. CLEAR ALL EXISTING AUTONESTCUT MODULES
begin
  if defined?(AutoNestCut)
    puts "🧹 Clearing existing AutoNestCut modules..."
    Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)
    puts "✅ AutoNestCut modules cleared"
  end
rescue => e
  puts "⚠️ Warning clearing modules: #{e.message}"
end

# 2. CLEAR LOADED FILES CACHE
puts "🧹 Clearing loaded files cache..."
cleared_count = 0
$LOADED_FEATURES.delete_if do |f| 
  if f.downcase.include?('autonestcut') || f.downcase.include?('auto_nest_cut')
    cleared_count += 1
    true
  else
    false
  end
end
puts "✅ Cleared #{cleared_count} cached files"

# 3. SET EXTENSION PATH
extension_path = "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension"
puts "📁 Extension path: #{extension_path}"

# 4. VERIFY PATH EXISTS
unless File.exist?(extension_path)
  puts "❌ ERROR: Extension path does not exist!"
  puts "📍 Expected: #{extension_path}"
  puts "🔍 Please verify the path is correct"
  return
end

# 5. VERIFY LOADER FILE EXISTS
loader_file = File.join(extension_path, "loader.rb")
unless File.exist?(loader_file)
  puts "❌ ERROR: loader.rb not found!"
  puts "📍 Expected: #{loader_file}"
  return
end

# 6. VERIFY MAIN FILE EXISTS
main_file = File.join(extension_path, "AutoNestCut", "main.rb")
unless File.exist?(main_file)
  puts "❌ ERROR: main.rb not found!"
  puts "📍 Expected: #{main_file}"
  return
end

# 7. LOAD THE EXTENSION
begin
  puts "🔄 Loading AutoNestCut extension..."
  
  # Change to extension directory
  original_dir = Dir.pwd
  Dir.chdir(extension_path)
  
  # Load the extension
  load "loader.rb"
  
  # Restore directory
  Dir.chdir(original_dir)
  
  puts "✅ AutoNestCut extension loaded successfully!"
  puts ""
  puts "🎯 EXTENSION READY TO USE:"
  puts "   • Menu: Extensions > AutoNestCut"
  puts "   • Toolbar: AutoNestCut icon"
  puts "   • Features: Generate Cut List, Documentation, License Info"
  puts ""
  puts "🔧 To use:"
  puts "   1. Select components/groups in your model"
  puts "   2. Click Extensions > AutoNestCut > Generate Cut List"
  puts "   3. Follow the configuration dialog"
  puts ""
  
rescue => e
  puts "❌ ERROR loading extension: #{e.message}"
  puts "📍 Error location: #{e.backtrace.first if e.backtrace}"
  puts ""
  puts "🔍 Troubleshooting:"
  puts "   • Check file paths are correct"
  puts "   • Verify all files exist in extension directory"
  puts "   • Check Ruby console for additional errors"
end

puts "🏁 Load process complete!"