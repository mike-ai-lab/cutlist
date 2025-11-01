let currentSettings = {};
let partsData = {};

function receiveInitialData(data) {
    currentSettings = data.settings;
    partsData = data.parts_by_material;
    
    populateSettings();
    displayPartsPreview();
}

function populateSettings() {
    document.getElementById('kerf_width').value = currentSettings.kerf_width || 3.0;
    document.getElementById('allow_rotation').checked = currentSettings.allow_rotation !== false;
    
    displayMaterials();
}

function displayMaterials() {
    const container = document.getElementById('materials_list');
    container.innerHTML = '';
    
    const materials = currentSettings.stock_materials || {};
    
    Object.keys(materials).forEach(material => {
        const dims = materials[material];
        const div = document.createElement('div');
        div.className = 'material-item';
        div.innerHTML = `
            <input type="text" value="${material}" onchange="updateMaterialName(this, '${material}')">
            <input type="number" value="${dims[0]}" onchange="updateMaterialWidth(this, '${material}')" placeholder="Width">
            <input type="number" value="${dims[1]}" onchange="updateMaterialHeight(this, '${material}')" placeholder="Height">
            <button onclick="removeMaterial('${material}')">Remove</button>
        `;
        container.appendChild(div);
    });
}

function addMaterial() {
    const name = prompt('Material name:');
    if (!name) return;
    
    const width = parseFloat(prompt('Width (mm):', '2440'));
    const height = parseFloat(prompt('Height (mm):', '1220'));
    
    if (isNaN(width) || isNaN(height)) return;
    
    currentSettings.stock_materials[name] = [width, height];
    displayMaterials();
}

function removeMaterial(material) {
    delete currentSettings.stock_materials[material];
    displayMaterials();
}

function updateMaterialName(input, oldName) {
    const newName = input.value;
    if (newName !== oldName) {
        currentSettings.stock_materials[newName] = currentSettings.stock_materials[oldName];
        delete currentSettings.stock_materials[oldName];
    }
}

function updateMaterialWidth(input, material) {
    currentSettings.stock_materials[material][0] = parseFloat(input.value);
}

function updateMaterialHeight(input, material) {
    currentSettings.stock_materials[material][1] = parseFloat(input.value);
}

function displayPartsPreview() {
    const container = document.getElementById('parts_preview');
    let html = '<h3>Parts Found:</h3>';
    
    Object.keys(partsData).forEach(material => {
        const parts = partsData[material];
        html += `<h4>${material} (${parts.length} parts)</h4>`;
        html += '<ul>';
        parts.forEach(part => {
            html += `<li>${part.name}: ${part.width.toFixed(1)} × ${part.height.toFixed(1)} × ${part.thickness.toFixed(1)}mm</li>`;
        });
        html += '</ul>';
    });
    
    container.innerHTML = html;
}

function processNesting() {
    // Update settings from form
    currentSettings.kerf_width = parseFloat(document.getElementById('kerf_width').value);
    currentSettings.allow_rotation = document.getElementById('allow_rotation').checked;
    
    // Send to SketchUp
    sketchup.process(JSON.stringify(currentSettings));
}

// Initialize when page loads
window.addEventListener('load', function() {
    sketchup.ready();
});