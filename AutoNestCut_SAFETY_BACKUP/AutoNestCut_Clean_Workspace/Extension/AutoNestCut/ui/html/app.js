let currentSettings = {};
let partsData = {};
let modelMaterials = [];
let showOnlyUsed = false;

function receiveInitialData(data) {
    currentSettings = data.settings;
    partsData = data.parts_by_material;
    window.hierarchyTree = data.hierarchy_tree || [];
    // Debug logging removed for production
    
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
        // structured layout: name + dims + price + actions
        div.innerHTML = `
            <input type="text" value="${material}" onchange="updateMaterialName(this, '${material}')" placeholder="Material Name">
            <input type="number" value="${width}" onchange="updateMaterialWidth(this, '${material}')" placeholder="Width (mm)">
            <input type="number" value="${height}" onchange="updateMaterialHeight(this, '${material}')" placeholder="Height (mm)">
            <input type="number" value="${price}" step="0.01" onchange="updateMaterialPrice(this, '${material}')" placeholder="Price per sheet">
            <div class="material-actions">
                <button class="material-action-btn" title="Remove material" onclick="removeMaterial('${material}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
                <button class="material-action-btn" title="Highlight material" onclick="highlightMaterial('${material}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
            <div class="material-status">${isUsed ? '<span class="used-indicator">✓ Used</span>' : '<span class="unused-indicator">Not Used</span>'}</div>
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
    // Render a structured parts preview: material cards with a compact table of parts
    container.innerHTML = '';
    const header = document.createElement('h3');
    header.textContent = 'Parts Found';
    container.appendChild(header);

    Object.keys(partsData).forEach(material => {
        const parts = partsData[material] || [];
        const card = document.createElement('div');
        card.className = 'parts-card';
        const title = document.createElement('div');
        title.className = 'parts-card-title';
        title.textContent = `${material} (${parts.length} parts)`;
        card.appendChild(title);

        if (parts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'parts-empty';
            empty.textContent = 'No parts for this material.';
            card.appendChild(empty);
        } else {
            const table = document.createElement('table');
            table.className = 'parts-preview-table';
            table.innerHTML = `<thead><tr><th>Name</th><th>W (mm)</th><th>H (mm)</th><th>Thick (mm)</th><th>Qty</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            let totalQuantity = 0;
            parts.forEach(part => {
                const name = part.name || 'Unnamed Part';
                const width = part.width || 0;
                const height = part.height || 0;
                const thickness = part.thickness || 0;
                const quantity = part.total_quantity || part.quantity || 1;
                totalQuantity += quantity;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(name)}</td>
                    <td>${width > 0 ? width.toFixed(1) : '-'}</td>
                    <td>${height > 0 ? height.toFixed(1) : '-'}</td>
                    <td>${thickness > 0 ? thickness.toFixed(1) : '-'}</td>
                    <td>${quantity}</td>
                `;
                tbody.appendChild(tr);
            });
            // Add total row
            const totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            totalRow.innerHTML = `
                <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
                <td style="font-weight: bold;">${totalQuantity}</td>
            `;
            tbody.appendChild(totalRow);
            table.appendChild(tbody);
            card.appendChild(table);
        }

        container.appendChild(card);
    });
}

// Small HTML escape used by parts preview
function escapeHtml(str) {
    return String(str).replace(/[&<>\"']/g, function (c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[c];
    });
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

function getCurrentSettings() {
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
    
    return convertedSettings;
}

function callRuby(method, args) {
    if (typeof sketchup === 'object' && sketchup[method]) {
        sketchup[method](args);
    } else {
        // Debug logging removed for production
    }
}

// Initialize when page loads
window.addEventListener('load', function() {
    callRuby('ready');
});