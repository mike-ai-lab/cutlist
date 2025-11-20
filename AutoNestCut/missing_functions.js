// MISSING FUNCTIONS THAT NEED TO BE ADDED TO app.js

// These functions are referenced in the HTML but missing from app.js:

function updateUnits() {
    const select = document.getElementById('settingsUnits');
    if (!select) return;
    
    currentUnits = select.value;
    globalSettingsChanged = true;
    
    // Update backend setting immediately
    callRuby('update_global_setting', JSON.stringify({key: 'units', value: currentUnits}));
    
    // Save to localStorage
    localStorage.setItem('autoNestCutUnits', currentUnits);
    
    // Update all UI elements with new units
    updateUnitLabels();
    displayMaterials();
    displayPartsPreview();
    
    // Update report if it exists
    if (window.renderReport && window.renderDiagrams) {
        window.currentUnits = currentUnits;
        window.renderReport();
        window.renderDiagrams();
    }
    
    // Save settings immediately
    const settingsToSave = {
        ...currentSettings,
        units: currentUnits
    };
    callRuby('save_settings', JSON.stringify(settingsToSave));
}

function updatePrecision() {
    const select = document.getElementById('settingsPrecision');
    if (!select) return;
    
    currentPrecision = parseInt(select.value);
    globalSettingsChanged = true;
    
    // Update backend setting immediately
    callRuby('update_global_setting', JSON.stringify({key: 'precision', value: currentPrecision}));
    
    // Save to localStorage
    localStorage.setItem('autoNestCutPrecision', currentPrecision);
    
    // Update all UI elements with new precision
    displayMaterials();
    displayPartsPreview();
    
    // Update report if it exists
    if (window.renderReport && window.renderDiagrams) {
        window.currentUnits = currentUnits;
        window.renderReport();
        window.renderDiagrams();
    }
    
    // Save settings immediately
    const settingsToSave = {
        ...currentSettings,
        precision: currentPrecision
    };
    callRuby('save_settings', JSON.stringify(settingsToSave));
}

// ISSUES FOUND:

// 1. The HTML config.html references updateUnits() and updatePrecision() functions
//    but these functions are missing from app.js

// 2. The existing updateUnitLabels() function only updates elements with 
//    data-translate attributes, but the materials table uses hardcoded labels

// 3. The report rendering in diagrams_report.js uses hardcoded units and precision
//    instead of the global currentUnits and currentPrecision variables

// 4. The displayMaterials() function needs to be updated to use dynamic unit labels

// 5. The report tables need to be regenerated when units/precision change