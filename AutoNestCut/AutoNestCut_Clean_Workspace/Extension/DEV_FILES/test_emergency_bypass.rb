# Test Emergency Bypass System
# Run this in SketchUp Ruby Console to test the emergency license

require_relative 'lib/LicenseManager/license_manager'
require_relative 'lib/LicenseManager/emergency_bypass'

puts "Testing Emergency Bypass System..."

# Test emergency license creation
if AutoNestCut::LicenseManager::EmergencyBypass.create_temporary_license
  puts "✅ Emergency license created successfully"
else
  puts "❌ Failed to create emergency license"
end

# Test emergency license validation
if AutoNestCut::LicenseManager::EmergencyBypass.is_emergency_license_valid?
  puts "✅ Emergency license is valid"
else
  puts "❌ Emergency license is not valid"
end

# Test main license manager with emergency bypass
if AutoNestCut::LicenseManager.has_valid_license?
  puts "✅ License manager reports valid license (including emergency)"
else
  puts "❌ License manager reports no valid license"
end

puts "Emergency bypass test complete!"