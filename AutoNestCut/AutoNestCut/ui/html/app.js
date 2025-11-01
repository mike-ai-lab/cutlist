let currentSettings = {};
let partsData = {};
let modelMaterials = [];

function receiveInitialData(data) {
    currentSettings = data.settings;
    partsData = data.parts_by_material;
    
    populateSettings();
    displayPartsPreview();
}

function addMaterial() {
    const container = document.getElementById('materials_list');
    const materialName = `New_Material_${Date.now()}`;
    
    currentSettings.stock_materials = currentSettings.stock_materials || {};
    currentSettings.stock_materials[materialName] = {
        width: 2440,
        height: 1220,
        price: 0
    };
    
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
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: parseFloat(input.value), height: data[1], price: 0 };
    } else {
        currentSettings.stock_materials[material].width = parseFloat(input.value);
    }
}

function updateMaterialHeight(input, material) {
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: parseFloat(input.value), price: 0 };
    } else {
        currentSettings.stock_materials[material].height = parseFloat(input.value);
    }
}

function updateMaterialPrice(input, material) {
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: data[1], price: parseFloat(input.value) };
    } else {
        currentSettings.stock_materials[material].price = parseFloat(input.value);
    }
}

function populateSettings() {
    document.getElementById('kerf_width').value = currentSettings.kerf_width || 3.0;
    document.getElementById('allow_rotation').checked = currentSettings.allow_rotation !== false;
    
    // Initialize stock_materials if it doesn't exist
    if (!currentSettings.stock_materials) {
        currentSettings.stock_materials = {
            'Plywood_19mm': { width: 2440, height: 1220, price: 0 },
            'Plywood_12mm': { width: 2440, height: 1220, price: 0 },
            'MDF_16mm': { width: 2800, height: 2070, price: 0 },
            'MDF_19mm': { width: 2800, height: 2070, price: 0 }
        };
    }
    
    displayMaterials();
}

function displayMaterials() {
    const container = document.getElementById('materials_list');
    container.innerHTML = '';
    
    currentSettings.stock_materials = currentSettings.stock_materials || {};
    const materials = currentSettings.stock_materials;
    
    Object.keys(materials).forEach(material => {
        const data = materials[material];
        let width, height, price;
        
        if (Array.isArray(data)) {
            width = data[0] || 2440;
            height = data[1] || 1220;
            price = 0;
        } else {
            width = data.width || 2440;
            height = data.height || 1220;
            price = data.price || 0;
        }
        
        const div = document.createElement('div');
        div.className = 'material-item';
        div.innerHTML = `
            <input type="text" value="${material}" onchange="updateMaterialName(this, '${material}')" placeholder="Material Name">
            <input type="number" value="${width}" onchange="updateMaterialWidth(this, '${material}')" placeholder="Width (mm)">
            <input type="number" value="${height}" onchange="updateMaterialHeight(this, '${material}')" placeholder="Height (mm)">
            <input type="number" value="${price}" step="0.01" onchange="updateMaterialPrice(this, '${material}')" placeholder="Price per sheet">
            <button onclick="removeMaterial('${material}')">Remove</button>
        `;
        container.appendChild(div);
    });
}



function displayPartsPreview() {
    const container = document.getElementById('parts_preview');
    let html = '<h3>Parts Found:</h3>';
    
    Object.keys(partsData).forEach(material => {
        const parts = partsData[material];
        html += `<h4>${material} (${parts.length} parts)</h4>`;
        html += '<ul>';
        parts.forEach(part => {
            const name = part.name || 'Unnamed Part';
            const width = part.width || 0;
            const height = part.height || 0;
            const thickness = part.thickness || 0;
            const quantity = part.total_quantity || 1;
            html += `<li>${name} (${quantity}x): ${width.toFixed(1)} × ${height.toFixed(1)} × ${thickness.toFixed(1)}mm</li>`;
        });
        html += '</ul>';
    });
    
    container.innerHTML = html;
}

function processNesting() {
    // Update settings from form
    currentSettings.kerf_width = parseFloat(document.getElementById('kerf_width').value);
    currentSettings.allow_rotation = document.getElementById('allow_rotation').checked;
    
    // Convert stock_materials to proper format for Ruby
    const convertedSettings = {
        kerf_width: currentSettings.kerf_width,
        allow_rotation: currentSettings.allow_rotation,
        stock_materials: {}
    };
    
    Object.keys(currentSettings.stock_materials || {}).forEach(material => {
        const data = currentSettings.stock_materials[material];
        convertedSettings.stock_materials[material] = {
            width: data.width || 2440,
            height: data.height || 1220,
            price: data.price || 0
        };
    });
    
    // Send to SketchUp
    callRuby('process', JSON.stringify(convertedSettings));
}

function callRuby(method, args) {
    if (typeof sketchup === 'object' && sketchup[method]) {
        sketchup[method](args);
    } else {
        console.log('Ruby call:', method, args);
    }
}

// Initialize when page loads
window.addEventListener('load', function() {
    callRuby('ready');
});