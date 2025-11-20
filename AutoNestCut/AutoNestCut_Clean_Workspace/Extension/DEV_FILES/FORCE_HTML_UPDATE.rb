# FORCE HTML UPDATE - Break SketchUp's HTML cache
html_files = [
  'AutoNestCut/ui/html/diagrams_report.html',
  'AutoNestCut/ui/html/diagrams_report.js',
  'AutoNestCut/ui/html/diagrams_style.css'
]

html_files.each do |file|
  full_path = File.join(__dir__, file)
  if File.exist?(full_path)
    # Change timestamp to force reload
    new_time = Time.now + rand(1000)
    File.utime(new_time, new_time, full_path)
    puts "Updated: #{file}"
  end
end

# Clear and reload
Object.send(:remove_const, :AutoNestCut) if Object.const_defined?(:AutoNestCut)
load File.join(__dir__, 'AutoNestCut', 'main_no_license.rb')

puts "✓ HTML CACHE FORCED UPDATE - v2.1 features should now appear"