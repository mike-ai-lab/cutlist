# Test script to verify trial restoration fix
require_relative 'lib/AutoNestCut/license_manager'
require_relative 'lib/AutoNestCut/trial_manager'

puts "=== AutoNestCut Trial Fix Test ==="
puts "Device ID: #{AutoNestCut::LicenseManager.send(:device_hash)}"
puts "License file exists: #{File.exist?(AutoNestCut::LicenseManager::LICENSE_FILE_PATH)}"

if File.exist?(AutoNestCut::LicenseManager::LICENSE_FILE_PATH)
  puts "Current trial days remaining: #{AutoNestCut::TrialManager.get_trial_days_remaining}"
end

puts "\nTesting server check for existing trial..."
result = AutoNestCut::LicenseManager.check_existing_trial(false)
puts "Server check result: #{result}"

if result
  puts "Trial restored! Days remaining: #{AutoNestCut::TrialManager.get_trial_days_remaining}"
else
  puts "No active trial found on server"
end

puts "\nTesting has_valid_license? method..."
puts "Has valid license: #{AutoNestCut::LicenseManager.has_valid_license?}"