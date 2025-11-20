# Test Panels Generator for AutoNestCut
require 'sketchup'

module TestPanelsGenerator
  def self.create_test_panels
    model = Sketchup.active_model
    model.start_operation('Create Test Panels', true)
    
    # Kitchen cabinet test panels with standard dimensions (in mm)
    panels = [
      {name: "Base_Cabinet_Side", width: 560, height: 720, thickness: 18, material: "Plywood_18mm"},
      {name: "Base_Cabinet_Back", width: 600, height: 720, thickness: 6, material: "MDF_6mm"},
      {name: "Base_Cabinet_Bottom", width: 560, height: 560, thickness: 18, material: "Plywood_18mm"},
      {name: "Base_Cabinet_Door", width: 300, height: 720, thickness: 18, material: "Oak_Veneer"},
      {name: "Wall_Cabinet_Side", width: 320, height: 720, thickness: 18, material: "Plywood_18mm"},
      {name: "Wall_Cabinet_Shelf", width: 560, height: 320, thickness: 18, material: "Plywood_18mm"},
      {name: "Drawer_Front", width: 280, height: 140, thickness: 18, material: "Oak_Veneer"},
      {name: "Drawer_Side", width: 450, height: 140, thickness: 12, material: "Birch_Plywood"},
      {name: "Drawer_Bottom", width: 450, height: 280, thickness: 6, material: "MDF_6mm"},
      {name: "Countertop", width: 600, height: 600, thickness: 40, material: "Granite"},
      {name: "Toe_Kick", width: 600, height: 100, thickness: 18, material: "Plywood_18mm"},
      {name: "Face_Frame_Rail", width: 600, height: 75, thickness: 18, material: "Oak_Solid"}
    ]
    
    x_offset = 0
    panels.each do |panel|
      # Create component definition
      definition = model.definitions.add(panel[:name])
      
      # Create rectangle face
      pts = [
        [0, 0, 0],
        [panel[:width].mm, 0, 0],
        [panel[:width].mm, panel[:height].mm, 0],
        [0, panel[:height].mm, 0]
      ]
      face = definition.entities.add_face(pts)
      face.pushpull(panel[:thickness].mm)
      
      # Set material attribute
      definition.set_attribute('AutoNestCut', 'Material', panel[:material])
      
      # Create instance in model
      instance = model.entities.add_instance(definition, [x_offset.mm, 0, 0])
      x_offset += panel[:width] + 50
    end
    
    model.commit_operation
    model.active_view.zoom_extents
    UI.messagebox("Created #{panels.length} test panels for kitchen cabinets")
  end
end

unless file_loaded?(__FILE__)
  toolbar = UI::Toolbar.new("Test Panels")
  
  cmd = UI::Command.new("Generate Test Panels") do
    TestPanelsGenerator.create_test_panels
  end
  
  cmd.tooltip = "Generate Kitchen Cabinet Test Panels"
  cmd.status_bar_text = "Create test components for AutoNestCut testing"
  
  toolbar.add_item(cmd)
  toolbar.show
  
  file_loaded(__FILE__)
end