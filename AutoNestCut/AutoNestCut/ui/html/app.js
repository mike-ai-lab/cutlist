let currentSettings = {};
let partsData = {};
let modelMaterials = [];
let showOnlyUsed = false;

function receiveInitialData(data) {
    currentSettings = data.settings;
    partsData = data.parts_by_material;
    window.hierarchyTree = data.hierarchy_tree || [];
    console.log('Received hierarchy tree:', window.hierarchyTree);
    
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
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, price: 0 };
    }
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: parseFloat(input.value), height: data[1], price: 0 };
    } else {
        currentSettings.stock_materials[material].width = parseFloat(input.value);
    }
}

function updateMaterialHeight(input, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, price: 0 };
    }
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: parseFloat(input.value), price: 0 };
    } else {
        currentSettings.stock_materials[material].height = parseFloat(input.value);
    }
}

function updateMaterialPrice(input, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, price: 0 };
    }
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
        currentSettings.stock_materials = {};
    }
    
    // Auto-load materials from detected parts
    const detectedMaterials = new Set();
    Object.keys(partsData).forEach(material => {
        detectedMaterials.add(material);
    });
    
    // Add detected materials to stock_materials if not already present
    detectedMaterials.forEach(material => {
        if (!currentSettings.stock_materials[material]) {
            currentSettings.stock_materials[material] = { width: 2440, height: 1220, price: 0 };
        }
    });
    
    displayMaterials();
}

function displayMaterials() {
    const container = document.getElementById('materials_list');
    container.innerHTML = '';
    
    currentSettings.stock_materials = currentSettings.stock_materials || {};
    const materials = currentSettings.stock_materials;
    
    const usedMaterials = new Set();
    Object.keys(partsData).forEach(material => {
        usedMaterials.add(material);
    });
    
    // Get sort option
    const sortBy = document.getElementById('sortBy')?.value || 'alphabetical';
    
    // Create material entries with usage info
    let materialEntries = Object.keys(materials).map(material => {
        const data = materials[material];
        const isUsed = usedMaterials.has(material);
        const usageCount = isUsed ? (partsData[material]?.length || 0) : 0;
        
        return {
            name: material,
            data: data,
            isUsed: isUsed,
            usageCount: usageCount
        };
    });
    
    // Sort materials
    if (sortBy === 'alphabetical') {
        materialEntries.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'usage') {
        materialEntries.sort((a, b) => b.isUsed - a.isUsed || a.name.localeCompare(b.name));
    } else if (sortBy === 'mostUsed') {
        materialEntries.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
    }
    
    // Filter if showing only used
    if (showOnlyUsed) {
        materialEntries = materialEntries.filter(entry => entry.isUsed);
    }
    
    materialEntries.forEach(entry => {
        const { name: material, data, isUsed } = entry;
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
        div.className = `material-item ${isUsed ? 'material-used' : 'material-unused'}`;
        div.innerHTML = `
            <input type="text" value="${material}" onchange="updateMaterialName(this, '${material}')" placeholder="Material Name">
            <input type="number" value="${width}" onchange="updateMaterialWidth(this, '${material}')" placeholder="Width (mm)">
            <input type="number" value="${height}" onchange="updateMaterialHeight(this, '${material}')" placeholder="Height (mm)">
            <input type="number" value="${price}" step="0.01" onchange="updateMaterialPrice(this, '${material}')" placeholder="Price per sheet">
            <button onclick="removeMaterial('${material}')">Remove</button>
            <button onclick="highlightMaterial('${material}')" class="highlight-btn">👁️</button>
            ${isUsed ? '<span class="used-indicator">✓ Used</span>' : '<span class="unused-indicator">Not Used</span>'}
        `;
        container.appendChild(div);
    });
    
    // Add gradient effect if folded
    if (showOnlyUsed && Object.keys(materials).length > materialEntries.length) {
        container.classList.add('folded');
    } else {
        container.classList.remove('folded');
    }
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
            if (width > 0 && height > 0 && thickness > 0) {
                html += `<li>${name} (${quantity}x): ${width.toFixed(1)} × ${height.toFixed(1)} × ${thickness.toFixed(1)}mm</li>`;
            }
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

function loadDefaults() {
    callRuby('load_default_materials');
}

function importCSV() {
    callRuby('import_materials_csv');
}

function exportDatabase() {
    callRuby('export_materials_database');
}

function toggleFold() {
    showOnlyUsed = !showOnlyUsed;
    const button = document.getElementById('foldToggle');
    button.textContent = showOnlyUsed ? 'Show All Materials' : 'Show Used Only';
    displayMaterials();
}

function highlightMaterial(material) {
    callRuby('highlight_material', material);
}

function clearHighlight() {
    callRuby('clear_highlight');
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