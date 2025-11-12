require 'net/http'
require 'uri'
require 'json'

# Test the server endpoints
device_id = "test-device-123"

puts "Testing /check-trial endpoint..."
uri = URI.parse('http://localhost:3000/check-trial')
http = Net::HTTP.new(uri.host, uri.port)
req = Net::HTTP::Post.new(uri.request_uri)
req['Content-Type'] = 'application/json'
req.body = { device_id: device_id }.to_json

begin
  res = http.request(req)
  puts "Response code: #{res.code}"
  puts "Response body: #{res.body}"
rescue => e
  puts "Error: #{e.message}"
end