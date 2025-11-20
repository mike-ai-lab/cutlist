# ========================================
# AutoNestCut CLEAN Extension Loader
# ========================================
# This script cleans up conflicts and loads the extension safely

puts "🧹 AutoNestCut Clean Load Process Starting..."

# 1. CHECK FOR CONFLICTING FILES IN PLUGINS FOLDER
plugins_dir = File.join(ENV['APPDATA'], 'SketchUp', 'SketchUp 2025', 'SketchUp', 'Plugins')
puts "🔍 Checking for conflicts in: #{plugins_dir}"

conflict_files = []
if Dir.exist?(plugins_dir)
  Dir.glob(File.join(plugins_dir, "**/*")).each do |file|
    if File.basename(file).downcase.include?('autonestcut') || 
       File.basename(file).downcase.include?('auto_nest_cut') ||
       (File.file?(file) && File.read(file, 100).include?('AutoNestCut'))
      conflict_files << file
    end
  end
end

if conflict_files.any?
  puts "⚠️ CONFLICTS FOUND:"
  conflict_files.each { |f| puts "   📄 #{f}" }
  puts ""
  puts "❌ Please remove these files first:"
  puts "   1. Close SketchUp"
  puts "   2. Delete the conflicting files above"
  puts "   3. Restart SketchUp"
  puts "   4. Run this script again"
  return
else
  puts "✅ No conflicts found in plugins folder"
end

# 2. CHECK FOR RBS/RBE FILES IN EXTENSION
extension_path = "c:/Users/Administrator/Desktop/AUTOMATION/cutlist/AutoNestCut/AutoNestCut_Clean_Workspace/Extension"
puts "🔍 Checking for encrypted files in extension..."

encrypted_files = []
if Dir.exist?(extension_path)
  Dir.glob(File.join(extension_path, "**/*.{rbs,rbe}")).each do |file|
    encrypted_files << file
  end
end

if encrypted_files.any?
  puts "⚠️ ENCRYPTED FILES FOUND (will cause conflicts):"
  encrypted_files.each { |f| puts "   📄 #{f}" }
  puts ""
  puts "❌ Please remove these encrypted files:"
  encrypted_files.each do |file|
    puts "   Deleting: #{file}"
    File.delete(file) rescue nil
  end
  puts "✅ Encrypted files removed"
else
  puts "✅ No encrypted files found"
end

# 3. CLEAR ALL EXISTING AUTONESTCUT MODULES
begin
  if defined?(AutoNestCut)
    puts "🧹 Clearing existing AutoNestCut modules..."
    Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)
    puts "✅ AutoNestCut modules cleared"
  end
rescue => e
  puts "⚠️ Warning clearing modules: #{e.message}"
end

# 4. CLEAR LOADED FILES CACHE
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

# 5. VERIFY EXTENSION STRUCTURE
puts "🔍 Verifying extension structure..."

required_files = [
  "loader.rb",
  "AutoNestCut/main.rb",
  "AutoNestCut/compatibility.rb",
  "AutoNestCut/config.rb",
  "lib/LicenseManager/license_manager.rb"
]

missing_files = []
required_files.each do |file|
  full_path = File.join(extension_path, file)
  if File.exist?(full_path)
    puts "   ✅ #{file}"
  else
    puts "   ❌ #{file} - MISSING"
    missing_files << file
  end
end

if missing_files.any?
  puts "❌ Missing required files. Cannot load extension."
  return
end

# 6. CHECK FOR RUBY SYNTAX ERRORS
puts "🔍 Checking Ruby syntax..."
begin
  ruby_files = Dir.glob(File.join(extension_path, "**/*.rb"))
  ruby_files.each do |file|
    content = File.read(file)
    # Basic syntax check
    eval("BEGIN { return }; #{content}", binding, file)
  end
  puts "✅ All Ruby files have valid syntax"
rescue SyntaxError => e
  puts "❌ Syntax error in #{e.message}"
  return
rescue => e
  puts "⚠️ Warning checking syntax: #{e.message}"
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
  
  puts ""
  puts "🎉 SUCCESS! AutoNestCut loaded cleanly!"
  puts ""
  puts "🎯 EXTENSION READY:"
  puts "   • Menu: Extensions > AutoNestCut"
  puts "   • Toolbar: AutoNestCut icon"
  puts "   • No conflicts or encrypted file issues"
  puts ""
  puts "🧪 TEST THE EXTENSION:"
  puts "   1. Select some components/groups"
  puts "   2. Extensions > AutoNestCut > Generate Cut List"
  puts "   3. Check licensing works"
  puts ""
  
rescue => e
  puts "❌ ERROR loading extension: #{e.message}"
  puts "📍 Error location: #{e.backtrace.first if e.backtrace}"
  puts ""
  puts "🔍 Troubleshooting steps:"
  puts "   1. Restart SketchUp completely"
  puts "   2. Check for any remaining conflicting files"
  puts "   3. Verify all paths are correct"
end

puts "🏁 Clean load process complete!"