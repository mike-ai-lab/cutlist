require 'sketchup.rb'

module AutoNestCut
  
  unless file_loaded?(__FILE__)
    puts "Loading AutoNestCut Extension"
    
    main_file = File.join(__dir__, 'AutoNestCut', 'main.rb')
    
    if File.exist?(main_file)
      load main_file
      puts "AutoNestCut loaded successfully"
    else
      puts "Main file not found: #{main_file}"
    end
    
    file_loaded(__FILE__)
  end
end
