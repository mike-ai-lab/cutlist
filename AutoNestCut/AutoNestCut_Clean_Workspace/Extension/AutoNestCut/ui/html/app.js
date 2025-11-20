let currentSettings = {};
let partsData = {};
let modelMaterials = [];
let showOnlyUsed = false;
let defaultCurrency = 'USD';
let currentUnits = 'mm';
let currentPrecision = 1;
let globalSettingsChanged = false;

// Currency exchange rates (base: USD)
let exchangeRates = {
    'USD': 1.0,
    'EUR': 0.85,
    'SAR': 3.74,
    'AED': 3.67,
    'GBP': 0.79,
    'CAD': 1.25,
    'AUD': 1.35
};

// Unit conversion factors FROM unit TO mm
const unitFactors = {
    'mm': 1,
    'cm': 10,
    'm': 1000,
    'in': 25.4,
    'ft': 304.8
};

// Area conversion factors to square meters
const areaFactors = {
    'mm': 1000000, // mm² to m²
    'cm': 10000,   // cm² to m²
    'm': 1,        // m² to m²
    'in': 645.16,  // in² to m²
    'ft': 10.764   // ft² to m²
};

// Convert value from mm to current display unit
function convertFromMM(valueInMM) {
    return valueInMM / unitFactors[currentUnits];
}

// Convert value from current display unit to mm
function convertToMM(valueInDisplayUnit) {
    return valueInDisplayUnit * unitFactors[currentUnits];
}

// Convert and format number with current precision
function formatDimension(valueInMM) {
    const converted = convertFromMM(valueInMM);
    if (currentPrecision == 0 || currentPrecision === '0' || currentPrecision === 0.0) {
        return Math.round(converted).toString();
    }
    return converted.toFixed(currentPrecision);
}

const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'AUD': 'A$',
    'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'BRL': 'R$', 'MXN': '$',
    'CHF': 'CHF', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł',
    'SAR': 'ر.س', 'AED': 'د.إ', 'KWD': 'د.ك', 'QAR': 'ر.ق', 'BHD': 'د.ب',
    'OMR': 'ر.ع', 'JOD': 'د.ا', 'LBP': 'ل.ل', 'EGP': 'ج.م', 'TND': 'د.ت',
    'MAD': 'د.م', 'DZD': 'د.ج', 'LYD': 'ل.د', 'IQD': 'د.ع', 'SYP': 'ل.س',
    'TRY': '₺', 'IRR': 'ریال'
};

function receiveInitialData(data) {
    currentSettings = data.settings;
    partsData = data.parts_by_material;
    window.hierarchyTree = data.hierarchy_tree || [];
    
    // Load global settings from backend only if not already set
    if (!globalSettingsChanged) {
        defaultCurrency = currentSettings.default_currency || 'USD';
        currentUnits = currentSettings.units || 'mm';
        // Ensure precision is properly handled, including 0 as a valid value
        currentPrecision = currentSettings.precision !== undefined ? currentSettings.precision : 1;
    }
    
    populateSettings();
    displayPartsPreview();
    updateUnitLabels();
    
    // Update report if it exists
    if (window.currentReportData || window.g_reportData) {
        if (window.renderReport) window.renderReport();
        if (window.renderDiagrams) window.renderDiagrams();
    }
}

function addMaterial() {
    const container = document.getElementById('materials_list');
    const materialName = `New_Material_${Date.now()}`;
    
    currentSettings.stock_materials = currentSettings.stock_materials || {};
    currentSettings.stock_materials[materialName] = {
        width: 2440,
        height: 1220,
        thickness: 18,
        price: 0,
        currency: defaultCurrency
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
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, thickness: 18, price: 0 };
    }
    const data = currentSettings.stock_materials[material];
    const valueInMM = convertToMM(parseFloat(input.value));
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: valueInMM, height: data[1], thickness: 18, price: 0 };
    } else {
        currentSettings.stock_materials[material].width = valueInMM;
    }
}

function updateMaterialHeight(input, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, thickness: 18, price: 0 };
    }
    const data = currentSettings.stock_materials[material];
    const valueInMM = convertToMM(parseFloat(input.value));
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: valueInMM, thickness: 18, price: 0 };
    } else {
        currentSettings.stock_materials[material].height = valueInMM;
    }
}

function updateMaterialThickness(input, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, thickness: 18, price: 0, currency: defaultCurrency };
    }
    const data = currentSettings.stock_materials[material];
    const valueInMM = convertToMM(parseFloat(input.value));
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: data[1], thickness: valueInMM, price: 0 };
    } else {
        currentSettings.stock_materials[material].thickness = valueInMM;
    }
}

function updateMaterialPrice(input, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, thickness: 18, price: 0, currency: defaultCurrency };
    }
    const data = currentSettings.stock_materials[material];
    if (Array.isArray(data)) {
        currentSettings.stock_materials[material] = { width: data[0], height: data[1], thickness: 18, price: parseFloat(input.value), currency: defaultCurrency };
    } else {
        currentSettings.stock_materials[material].price = parseFloat(input.value);
    }
}

function updateMaterialCurrency(select, material) {
    if (!currentSettings.stock_materials[material]) {
        currentSettings.stock_materials[material] = { width: 2440, height: 1220, thickness: 18, price: 0, currency: defaultCurrency };
    }
    currentSettings.stock_materials[material].currency = select.value;
}

function updateDefaultCurrency() {
    const select = document.getElementById('defaultCurrency');
    if (!select) return;
    
    defaultCurrency = select.value;
    
    // Update backend setting immediately - ONLY currency
    callRuby('update_global_setting', JSON.stringify({key: 'default_currency', value: defaultCurrency}));
    
    // Update ALL materials to use the new currency
    Object.keys(currentSettings.stock_materials || {}).forEach(material => {
        const data = currentSettings.stock_materials[material];
        data.currency = defaultCurrency;
    });
    
    displayMaterials();
    
    // Update report if it exists
    if (window.renderReport) {
        window.renderReport();
    }
}

function formatPrice(price, currency) {
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${parseFloat(price || 0).toFixed(2)}`;
}

function populateSettings() {
    const kerfInput = document.getElementById('kerf_width');
    const rotationInput = document.getElementById('allow_rotation');
    
    if (kerfInput) {
        kerfInput.value = formatDimension(currentSettings.kerf_width || 3.0);
    }
    if (rotationInput) {
        rotationInput.checked = currentSettings.allow_rotation !== false;
    }
    
    // Set global settings controls with proper checks
    setTimeout(() => {
        const currencySelect = document.getElementById('defaultCurrency');
        if (currencySelect && defaultCurrency) {
            currencySelect.value = defaultCurrency;
        }
        const unitsSelect = document.getElementById('settingsUnits');
        if (unitsSelect && currentUnits) {
            unitsSelect.value = currentUnits;
        }
        const precisionSelect = document.getElementById('settingsPrecision');
        if (precisionSelect && currentPrecision !== undefined) {
            precisionSelect.value = currentPrecision.toString();
        }
        
        // Also update the settings modal controls
        const modalCurrencySelect = document.getElementById('settingsCurrency');
        if (modalCurrencySelect && defaultCurrency) {
            modalCurrencySelect.value = defaultCurrency;
        }
    }, 50);
    
    // Initialize stock_materials if it doesn't exist
    if (!currentSettings.stock_materials) {
        currentSettings.stock_materials = {};
    }
    
    // Auto-load materials from detected parts
    const detectedMaterials = new Set();
    Object.keys(partsData).forEach(material => {
        detectedMaterials.add(material);
    });
    
    // Add detected materials to stock_materials if not already present with standard dimensions
    detectedMaterials.forEach(material => {
        if (!currentSettings.stock_materials[material]) {
            currentSettings.stock_materials[material] = { 
                width: 2440, 
                height: 1220, 
                thickness: 18, 
                price: 0, 
                currency: defaultCurrency 
            };
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
    
    const unitLabel = getUnitLabel();
    
    materialEntries.forEach(entry => {
        const { name: material, data, isUsed } = entry;
        let width, height, thickness, price, currency;
        
        if (Array.isArray(data)) {
            width = data[0] || 2440;
            height = data[1] || 1220;
            thickness = 18;
            price = 0;
            currency = defaultCurrency;
        } else {
            width = data.width || 2440;
            height = data.height || 1220;
            thickness = data.thickness || 18;
            price = data.price || 0;
            currency = data.currency || defaultCurrency;
        }
        
        const div = document.createElement('div');
        div.className = `material-item ${isUsed ? 'material-used' : 'material-unused'}`;
        // structured layout: name + dims + price + actions
        div.innerHTML = `
            <input type="text" value="${material}" onchange="updateMaterialName(this, '${material}')" placeholder="Material Name">
            <input type="number" value="${formatDimension(width)}" onchange="updateMaterialWidth(this, '${material}')" placeholder="Width (${unitLabel})">
            <input type="number" value="${formatDimension(height)}" onchange="updateMaterialHeight(this, '${material}')" placeholder="Height (${unitLabel})">
            <input type="number" value="${formatDimension(thickness)}" onchange="updateMaterialThickness(this, '${material}')" placeholder="Thickness (${unitLabel})">
            <input type="number" value="${price.toFixed(2)}" step="0.01" onchange="updateMaterialPrice(this, '${material}')" placeholder="Price per sheet">
            <select onchange="updateMaterialCurrency(this, '${material}')" class="sort-select">
                ${Object.keys(currencySymbols).map(curr => 
                    `<option value="${curr}" ${curr === currency ? 'selected' : ''}>${curr} (${currencySymbols[curr]})</option>`
                ).join('')}
            </select>
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
            <div class="material-status">${isUsed ? `<span class="used-indicator">✓ Used</span>` : `<span class="unused-indicator">Not Used</span>`}</div>
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

    const unitLabel = getUnitLabel();

    Object.keys(partsData).forEach(material => {
        const parts = partsData[material] || [];
        const card = document.createElement('div');
        card.className = 'parts-card';
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
        const title = document.createElement('div');
        title.className = 'parts-card-title';
        title.textContent = `${material} (${parts.length} parts)`;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-table-btn';
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>Markdown`;
        copyBtn.onclick = () => copyPartsPreview(material, copyBtn);
        titleContainer.appendChild(title);
        titleContainer.appendChild(copyBtn);
        card.appendChild(titleContainer);

        if (parts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'parts-empty';
            empty.textContent = 'No parts for this material.';
            card.appendChild(empty);
        } else {
            const table = document.createElement('table');
            table.className = 'parts-preview-table';
            table.id = `parts-preview-${material.replace(/[^a-zA-Z0-9]/g, '_')}`;
            table.innerHTML = `<thead><tr><th>Name</th><th>W (${unitLabel})</th><th>H (${unitLabel})</th><th>T (${unitLabel})</th><th>Qty</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            let totalQuantity = 0;
            parts.forEach(part => {
                const name = part.name || 'Unnamed Part';
                const width = formatDimension(part.width || 0);
                const height = formatDimension(part.height || 0);
                const thickness = formatDimension(part.thickness || 0);
                const quantity = part.total_quantity || part.quantity || 1;
                totalQuantity += quantity;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(name)}</td>
                    <td>${parseFloat(width) > 0 ? width : '-'}</td>
                    <td>${parseFloat(height) > 0 ? height : '-'}</td>
                    <td>${parseFloat(thickness) > 0 ? thickness : '-'}</td>
                    <td>${quantity}</td>
                `;
                tbody.appendChild(tr);
            });
            // Add total row
            const totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            totalRow.innerHTML = `
                <td colspan="4" style="text-align: right; font-weight: bold;">Total</td>
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
    // Update settings from form - convert kerf width to mm
    const kerfInput = document.getElementById('kerf_width');
    currentSettings.kerf_width = convertToMM(parseFloat(kerfInput.value));
    currentSettings.allow_rotation = document.getElementById('allow_rotation').checked;
    
    // Convert stock_materials to proper format for Ruby
    const convertedSettings = {
        kerf_width: currentSettings.kerf_width,
        allow_rotation: currentSettings.allow_rotation,
        default_currency: defaultCurrency,
        units: currentUnits,
        precision: currentPrecision,
        stock_materials: {}
    };
    
    Object.keys(currentSettings.stock_materials || {}).forEach(material => {
        const data = currentSettings.stock_materials[material];
        convertedSettings.stock_materials[material] = {
            width: data.width || 2440,
            height: data.height || 1220,
            price: data.price || 0,
            currency: data.currency || defaultCurrency
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
    const span = button.querySelector('span');
    if (span) {
        span.textContent = showOnlyUsed ? 'Show All Materials' : 'Show Used Only';
    }
    displayMaterials();
}

function highlightMaterial(material) {
    callRuby('highlight_material', material);
}

function clearHighlight() {
    callRuby('clear_highlight');
}

function getCurrentSettings() {
    // Update settings from form - convert kerf width to mm
    const kerfInput = document.getElementById('kerf_width');
    currentSettings.kerf_width = convertToMM(parseFloat(kerfInput.value));
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
            price: data.price || 0,
            currency: data.currency || defaultCurrency
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

// Resizer functionality
let resizerInitialized = false;

function initResizer() {
    if (resizerInitialized) return;
    
    const resizer = document.getElementById('resizer');
    const leftSide = document.getElementById('diagramsContainer');
    const rightSide = document.getElementById('reportContainer');
    
    if (!resizer || !leftSide || !rightSide) return;
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        const totalWidth = containerRect.width;
        
        if (newLeftWidth > 300 && totalWidth - newLeftWidth > 400) {
            leftSide.style.flex = `0 0 ${newLeftWidth}px`;
            rightSide.style.flex = `1 1 auto`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    resizerInitialized = true;
}









function updateUnits() {
    const select = document.getElementById('settingsUnits');
    if (!select) return;
    
    currentUnits = select.value;
    
    // Update backend setting immediately - ONLY units
    callRuby('update_global_setting', JSON.stringify({key: 'units', value: currentUnits}));
    localStorage.setItem('autoNestCutUnits', currentUnits);
    
    updateUnitLabels();
    displayMaterials();
    displayPartsPreview();
    
    if (typeof renderReport === 'function' && typeof renderDiagrams === 'function') {
        renderReport();
        renderDiagrams();
    }
}

function updatePrecision() {
    const select = document.getElementById('settingsPrecision');
    if (!select) return;
    
    currentPrecision = parseInt(select.value);
    
    // Update backend setting immediately - ONLY precision
    callRuby('update_global_setting', JSON.stringify({key: 'precision', value: currentPrecision}));
    localStorage.setItem('autoNestCutPrecision', currentPrecision);
    
    displayMaterials();
    displayPartsPreview();
    
    if (typeof renderReport === 'function' && typeof renderDiagrams === 'function') {
        renderReport();
        renderDiagrams();
    }
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'block';
        
        const unitsSelect = document.getElementById('settingsUnits');
        const precisionSelect = document.getElementById('settingsPrecision');
        const currencySelect = document.getElementById('settingsCurrency');
        
        if (unitsSelect) unitsSelect.value = currentUnits;
        if (precisionSelect) precisionSelect.value = currentPrecision;
        if (currencySelect) currencySelect.value = defaultCurrency;
        
        // Allow clicking outside to close
        modal.onclick = (e) => {
            if (e.target === modal) closeSettings();
        };
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateExchangeRate() {
    const fromCurrency = document.getElementById('convertFromCurrency').value;
    const toCurrency = document.getElementById('convertToCurrency').value;
    const rate = parseFloat(document.getElementById('exchangeRate').value);
    
    if (rate > 0) {
        // Update the exchange rate
        exchangeRates[toCurrency] = rate * exchangeRates[fromCurrency];
        localStorage.setItem('autoNestCutExchangeRates', JSON.stringify(exchangeRates));
    }
}

function convertReportCurrency() {
    const fromCurrency = document.getElementById('convertFromCurrency').value;
    const toCurrency = document.getElementById('convertToCurrency').value;
    const rate = parseFloat(document.getElementById('exchangeRate').value) || exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    
    if (!g_reportData || fromCurrency === toCurrency) return;
    
    // Convert all currency values in the report
    if (g_reportData.summary) {
        g_reportData.summary.total_project_cost *= rate;
        g_reportData.summary.currency = toCurrency;
    }
    
    if (g_reportData.unique_board_types) {
        g_reportData.unique_board_types.forEach(board => {
            if (board.currency === fromCurrency) {
                board.price_per_sheet *= rate;
                board.total_cost *= rate;
                board.currency = toCurrency;
            }
        });
    }
    
    // Update default currency
    defaultCurrency = toCurrency;
    document.getElementById('defaultCurrency').value = toCurrency;
    
    if (typeof renderReport === 'function') {
        renderReport();
    }
}

function updateAreaUnits() {
    const select = document.getElementById('settingsAreaUnits');
    if (!select) return;
    
    window.currentAreaUnits = select.value;
    
    // Update backend setting immediately
    callRuby('update_global_setting', JSON.stringify({key: 'area_units', value: window.currentAreaUnits}));
    localStorage.setItem('autoNestCutAreaUnits', window.currentAreaUnits);
    
    // Update report if it exists
    if (typeof renderReport === 'function') {
        renderReport();
    }
}

function updateCurrency() {
    const select = document.getElementById('settingsCurrency');
    if (!select) return;
    
    defaultCurrency = select.value;
    const mainCurrencySelect = document.getElementById('defaultCurrency');
    if (mainCurrencySelect) {
        mainCurrencySelect.value = defaultCurrency;
    }
    
    // Update backend setting immediately - ONLY currency
    callRuby('update_global_setting', JSON.stringify({key: 'default_currency', value: defaultCurrency}));
    
    // Update ALL materials to use the new currency
    Object.keys(currentSettings.stock_materials || {}).forEach(material => {
        const data = currentSettings.stock_materials[material];
        data.currency = defaultCurrency;
    });
    
    displayMaterials();
    
    // Update report if it exists
    if (typeof renderReport === 'function') {
        renderReport();
    }
}





function updateUnitLabels() {
    const unitText = currentUnits;
    
    // Update data-translate elements
    document.querySelectorAll('[data-translate="width_mm"]').forEach(el => {
        el.textContent = `Width (${unitText})`;
    });
    document.querySelectorAll('[data-translate="height_mm"]').forEach(el => {
        el.textContent = `Height (${unitText})`;
    });
    document.querySelectorAll('[data-translate="thickness_mm"]').forEach(el => {
        el.textContent = `Thickness (${unitText})`;
    });
    
    // Update kerf width label
    const kerfLabel = document.querySelector('label[for="kerf_width"]');
    if (kerfLabel) {
        kerfLabel.textContent = `Kerf Width (${unitText}):`;
    }
    
    // Update any other unit labels in the interface
    document.querySelectorAll('.unit-label').forEach(el => {
        el.textContent = unitText;
    });
}

function formatNumber(value) {
    if (currentPrecision == 0 || currentPrecision === '0' || currentPrecision === 0.0) {
        return Math.round(parseFloat(value)).toString();
    }
    return parseFloat(value).toFixed(currentPrecision);
}





function getUnitLabel() {
    return currentUnits;
}

function getAreaUnitLabel() {
    switch(currentUnits) {
        case 'mm': return 'mm²';
        case 'cm': return 'cm²';
        case 'm': return 'm²';
        case 'in': return 'in²';
        case 'ft': return 'ft²';
        default: return 'mm²';
    }
}

function convertAreaToDisplayUnit(areaInMm2) {
    const factor = areaFactors[currentUnits];
    return areaInMm2 / factor;
}

function copyPartsPreview(material, button) {
    const tableId = `parts-preview-${material.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let markdown = `## ${material}\n\n`;
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => cell.textContent.trim()).join(' | ');
        markdown += '| ' + rowData + ' |\n';
        
        if (index === 0) {
            const separator = Array.from(cells).map(() => '---').join(' | ');
            markdown += '| ' + separator + ' |\n';
        }
    });
    
    navigator.clipboard.writeText(markdown).then(() => {
        button.classList.add('copied');
        const originalText = button.innerHTML;
        button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>Copied!`;
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);
    });
}

// Initialize when page loads
window.addEventListener('load', function() {
    // Initialize settings - handle precision properly including 0
    currentUnits = localStorage.getItem('autoNestCutUnits') || 'mm';
    const savedPrecision = localStorage.getItem('autoNestCutPrecision');
    currentPrecision = savedPrecision !== null ? parseInt(savedPrecision) : 1;
    
    // Load saved exchange rates
    const savedRates = localStorage.getItem('autoNestCutExchangeRates');
    if (savedRates) {
        exchangeRates = JSON.parse(savedRates);
    }
    
    callRuby('ready');
    setTimeout(initResizer, 100);
});