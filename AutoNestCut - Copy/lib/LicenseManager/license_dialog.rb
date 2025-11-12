# AutoNestCut License Information Dialog
require_relative 'license_manager'

module AutoNestCut
  class LicenseDialog
    
    def self.show
      license_info = get_license_info
      html_content = generate_html(license_info)
      
      dialog = UI::HtmlDialog.new(
        dialog_title: "AutoNestCut License Information",
        preferences_key: "AutoNestCut_License_Dialog",
        scrollable: true,
        resizable: false,
        width: 450,
        height: 400,
        left: 200,
        top: 200,
        min_width: 450,
        min_height: 400,
        max_width: 450,
        max_height: 400,
        style: UI::HtmlDialog::STYLE_DIALOG
      )
      
      dialog.set_html(html_content)
      
      dialog.add_action_callback("remove_license") do |action_context|
        result = UI.messagebox(
          "Are you sure you want to remove the current license?\n\nThis will disable the extension until re-activation.",
          MB_YESNO,
          "Remove License"
        )
        if result == IDYES
          remove_license
          dialog.close
          UI.messagebox("License removed. Extension disabled.\n\nRestart SketchUp to re-activate.", MB_OK, "License Removed")
          # Immediately disable extension functionality
          disable_extension
        end
      end
      
      dialog.add_action_callback("purchase_license") do |action_context|
        UI.openURL("mailto:muhamad.shkeir@gmail.com?subject=AutoNestCut License Purchase")
      end
      
      dialog.show
    end
    
    private
    
    def self.get_license_info
      info = {
        extension_name: "AutoNestCut",
        version: "V 1.0",
        status: "Unknown",
        days_remaining: "N/A",
        licensed_by: "AutoNestCut Development Team",
        licensed_to: "N/A",
        user_name: "N/A"
      }
      
      if File.exist?(AutoNestCut::LicenseManager::LICENSE_FILE_PATH)
        begin
          encoded_jwt = File.read(AutoNestCut::LicenseManager::LICENSE_FILE_PATH).strip
          jwt_token = AutoNestCut::LicenseManager.send(:decode_token, encoded_jwt)
          if AutoNestCut::LicenseManager.validate_jwt(jwt_token)
            payload = AutoNestCut::LicenseManager.send(:decode_jwt_payload, jwt_token)
            
            is_trial = payload['is_trial'] == true
            info[:status] = is_trial ? 'trial' : 'licensed'
            info[:licensed_to] = payload['email'] || 'N/A'
            info[:user_name] = payload['name'] || payload['user_name'] || 'N/A'
            info[:is_trial] = is_trial
            
            if payload['exp'] && is_trial
              exp_time = Time.at(payload['exp'])
              days_left = ((exp_time - Time.now) / 86400).ceil
              info[:days_remaining] = days_left > 0 ? days_left.to_s : "0"
            else
              info[:days_remaining] = "-"
            end
          else
            info[:status] = "Invalid"
          end
        rescue => e
          info[:status] = "Error: #{e.message}"
        end
      else
        info[:status] = "Not Activated"
      end
      
      info
    end
    
    def self.remove_license
      if File.exist?(AutoNestCut::LicenseManager::LICENSE_FILE_PATH)
        File.delete(AutoNestCut::LicenseManager::LICENSE_FILE_PATH)
        # Clear any cached license state
        AutoNestCut::LicenseManager.instance_variable_set(:@license_checked, nil)
      end
    end
    
    def self.disable_extension
      # Remove all AutoNestCut menus and toolbars
      begin
        UI.remove_toolbar('AutoNestCut') if UI.toolbar('AutoNestCut')
      rescue
      end
      
      # Clear status
      Sketchup.status_text = ""
    end
    
    def self.generate_html(info)
      is_trial = info[:status] == 'trial'
      <<~HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 15px;
              background: #f5f5f5;
              color: #333;
            }
            .container {
              background: white;
              border: 1px solid #ccc;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .title {
              font-size: 18px;
              font-weight: 600;
              color: #333;
              margin: 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-row:last-of-type {
              border-bottom: none;
            }
            .label {
              font-weight: 500;
              color: #555;
              font-size: 13px;
            }
            .value {
              font-weight: 400;
              color: #333;
              font-size: 13px;
              text-align: right;
            }
            .status-container {
              display: flex;
              gap: 10px;
              align-items: center;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              border: 1px solid #ddd;
              background: #f8f9fa;
              color: #666;
            }
            .status-badge.active {
              background: #d4edda;
              border-color: #c3e6cb;
              color: #155724;
            }
            .purchase-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 11px;
              margin-left: 5px;
            }
            .purchase-btn:hover {
              background: #0056b3;
            }
            .button-container {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
            }
            .remove-btn {
              background: #dc3545;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
            }
            .remove-btn:hover {
              background: #c82333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">License Information</h1>
            </div>
            
            <div class="info-row">
              <span class="label">Extension:</span>
              <span class="value">#{info[:extension_name]}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Version:</span>
              <span class="value">#{info[:version]}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Status:</span>
              <div class="status-container">
                <span class="status-badge #{is_trial ? '' : 'active'}">Licensed</span>
                <span class="status-badge #{is_trial ? 'active' : ''}">Free Trial</span>
                #{is_trial ? '<button class="purchase-btn" onclick="sketchup.purchase_license()">Purchase</button>' : ''}
              </div>
            </div>
            
            <div class="info-row">
              <span class="label">Days Remaining:</span>
              <span class="value">#{info[:days_remaining]}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Licensed By:</span>
              <span class="value">#{info[:licensed_by]}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Licensed To:</span>
              <span class="value">#{info[:user_name] != 'N/A' ? info[:user_name] : info[:licensed_to]}</span>
            </div>
            
            <div class="button-container">
              <button class="remove-btn" onclick="sketchup.remove_license()">Remove License</button>
            </div>
          </div>
        </body>
        </html>
      HTML
    end
    
  end
end