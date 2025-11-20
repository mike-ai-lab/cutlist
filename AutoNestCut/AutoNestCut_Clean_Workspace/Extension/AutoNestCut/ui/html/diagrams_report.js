// Global formatting utility - put this at the top of the script or in a global utility file.
// This ensures consistency across all numeric displays affected by precision settings.
function getAreaDisplay(areaMM2, areaUnits) {
    const areaFactors = { mm2: 1, cm2: 100, m2: 1000000, in2: 645.16, ft2: 92903.04 };
    const areaLabels = { mm2: 'mm²', cm2: 'cm²', m2: 'm²', in2: 'in²', ft2: 'ft²' };
    const units = areaUnits || 'm2';
    const convertedArea = areaMM2 / areaFactors[units];
    return `${convertedArea.toFixed(3)} ${areaLabels[units]}`;
}

function formatNumber(value, precision) {
    if (typeof value !== 'number') {
        // Handle cases where value might not be a number gracefully
        console.warn('formatNumber received non-numeric value:', value);
        return String(value); 
    }
    
    // Explicitly check for 0 or string '0' to use Math.round for no decimal places.
    // This correctly renders 800 instead of 800.0 when precision is 0.
    if (precision === 0 || precision === '0' || precision === 0.0) {
        return Math.round(value).toString();
    }
    
    // Ensure precision is a valid non-negative number for toFixed.
    const actualPrecision = typeof precision === 'number' ? precision : parseFloat(precision);
    if (isNaN(actualPrecision) || actualPrecision < 0) {
        console.warn('Invalid precision provided to formatNumber, defaulting to 1 decimal:', precision);
        return value.toFixed(1); // Default to 1 decimal place if precision is invalid
    }
    
    return value.toFixed(actualPrecision);
}

function callRuby(method, args) {
    if (typeof sketchup === 'object' && sketchup[method]) {
        sketchup[method](args);
    } else {
        // Debug logging removed for production
    }
}

let g_boardsData = [];
let g_reportData = null;
let currentHighlightedPiece = null;
let currentHighlightedCanvas = null;

// Use global unitFactors and currencySymbols from app.js

function receiveData(data) {
    // Debug logging removed for production
    g_boardsData = data.diagrams;
    g_reportData = data.report;
    window.originalComponents = data.original_components || [];
    window.hierarchyTree = data.hierarchy_tree || [];
    
    renderDiagrams();
    renderReport();
}

function convertDimension(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    const valueInMM = value * unitFactors[fromUnit];
    return valueInMM / unitFactors[toUnit];
}

function renderDiagrams() {
    console.log('renderDiagrams called, g_boardsData:', g_boardsData);
    
    const container = document.getElementById('diagramsContainer');
    if (!container) {
        console.error('diagramsContainer element not found');
        return;
    }
    
    container.innerHTML = '';

    if (!g_boardsData || g_boardsData.length === 0) {
        console.log('No boards data available');
        container.innerHTML = '<p>No cutting diagrams to display. Please generate a cut list first.</p>';
        return;
    }
    
    console.log('Rendering', g_boardsData.length, 'diagrams');

    g_boardsData.forEach((board, boardIndex) => {
        console.log('Rendering board', boardIndex, ':', board);
        const card = document.createElement('div');
        card.className = 'diagram-card';

        const title = document.createElement('h3');
        title.textContent = `${board.material} Board ${boardIndex + 1}`;
        title.id = `diagram-${board.material.replace(/[^a-zA-Z0-9]/g, '_')}-${boardIndex}`;
        card.appendChild(title);

        const info = document.createElement('p');
        const units = currentUnits || 'mm';
        // FIX: Use nullish coalescing operator (??) to correctly handle currentPrecision being 0
        const precision = currentPrecision ?? 1; 
        
        const width = board.stock_width / unitFactors[units];
        const height = board.stock_height / unitFactors[units];
        
        // Use the global formatNumber function for board dimensions in the info section
        info.innerHTML = `Size: ${formatNumber(width, precision)}x${formatNumber(height, precision)}${units}<br>
                          Waste: ${board.waste_percentage.toFixed(1)}% (Efficiency: ${board.efficiency_percentage.toFixed(1)}%)`;
        card.appendChild(info);

        const canvas = document.createElement('canvas');
        canvas.className = 'diagram-canvas';
        card.appendChild(canvas);

        container.appendChild(card);

        function drawCanvas() {
            const containerWidth = card.offsetWidth - 24;
            const ctx = canvas.getContext('2d');
            const padding = 40;
            const maxCanvasDim = Math.min(containerWidth, 600);
            
            const boardWidth = parseFloat(board.stock_width) || 1000;
            const boardHeight = parseFloat(board.stock_height) || 1000;
            
            const scale = Math.min(
                (maxCanvasDim - 2 * padding) / boardWidth,
                (maxCanvasDim - 2 * padding) / boardHeight
            );

            canvas.width = boardWidth * scale + 2 * padding;
            canvas.height = boardHeight * scale + 2 * padding;

        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(padding, padding, boardWidth * scale, boardHeight * scale);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, boardWidth * scale, boardHeight * scale);
        
        ctx.fillStyle = '#333';
        ctx.font = `${Math.max(12, 14 * scale)}px Arial`;
        ctx.textAlign = 'center';
        const reportUnits = currentUnits || 'mm';
        const displayWidth = boardWidth / unitFactors[reportUnits];
        // FIX: Use formatNumber for canvas board dimensions for consistency
        ctx.fillText(`${formatNumber(displayWidth, 0)}${reportUnits}`, padding + (boardWidth * scale) / 2, padding - 5);
        
        ctx.save();
        ctx.translate(padding - 15, padding + (boardHeight * scale) / 2);
        ctx.rotate(-Math.PI / 2);
        const displayHeight = boardHeight / unitFactors[reportUnits];
        // FIX: Use formatNumber for canvas board dimensions for consistency
        ctx.fillText(`${formatNumber(displayHeight, 0)}${reportUnits}`, 0, 0);
        ctx.restore();

        const parts = board.parts || [];
        console.log('Board', boardIndex, 'has', parts.length, 'parts');
        canvas.boardIndex = boardIndex;
        canvas.boardData = board;
        canvas.partData = [];
        
        parts.forEach((part, partIndex) => {
            console.log('Rendering part', partIndex, ':', part);
            // Ensure part dimensions and positions are valid numbers
            const partPosX = parseFloat(part.x) || 0;
            const partPosY = parseFloat(part.y) || 0;
            const partW = parseFloat(part.width) || 10;
            const partH = parseFloat(part.height) || 10;
            
            const partX = padding + partPosX * scale;
            const partY = padding + partPosY * scale;
            const partWidth = partW * scale;
            const partHeight = partH * scale;

            ctx.fillStyle = getMaterialColor(part.material);
            ctx.fillRect(partX, partY, partWidth, partHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(partX, partY, partWidth, partHeight);

            canvas.partData.push({
                x: partX, y: partY, width: partWidth, height: partHeight,
                part: part, boardIndex: boardIndex
            });

            if (partWidth > 30 && partHeight > 20) {
                ctx.fillStyle = '#000000';
                ctx.font = `bold ${Math.max(14, 16 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelContent = String(part.instance_id || `P${partIndex + 1}`);
                const maxChars = Math.max(6, Math.floor(partWidth / 8));
                const displayLabel = labelContent.length > maxChars ? labelContent.slice(0, maxChars - 1) + '…' : labelContent;
                ctx.fillText(displayLabel, partX + partWidth / 2, partY + partHeight / 2);
            }

            if (partWidth > 50) {
                ctx.fillStyle = '#000000';
                ctx.font = `${Math.max(11, 12 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const partDisplayW = partW / unitFactors[reportUnits];
                ctx.fillText(`${Math.round(partDisplayW)}${reportUnits}`, partX + partWidth / 2, partY + 5); 
            }

            if (partHeight > 50) {
                ctx.save();
                ctx.translate(partX + 5, partY + partHeight / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = '#000000';
                ctx.font = `${Math.max(11, 12 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const partDisplayH = partH / unitFactors[reportUnits];
                ctx.fillText(`${Math.round(partDisplayH)}${reportUnits}`, 0, 0); 
                ctx.restore();
            }
        });

            canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas));
            canvas.addEventListener('mousemove', (e) => handleCanvasHover(e, canvas));
            canvas.style.cursor = 'pointer';
        }
        
        drawCanvas();
        
        const resizeObserver = new ResizeObserver(() => {
            drawCanvas();
        });
        resizeObserver.observe(card);
    });
    
    console.log('Finished rendering diagrams');
}

function renderReport() {
    console.log('renderReport called, g_reportData:', g_reportData);
    
    if (!g_reportData) {
        console.error('No report data available');
        return;
    }
    
    // Validate report data structure
    if (!g_reportData.summary) {
        console.error('Report data missing summary section');
        const container = document.getElementById('reportContainer');
        if (container) {
            container.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h3>Invalid Report Data</h3><p>The report data is incomplete. Please try generating the cut list again.</p></div>';
        }
        return;
    }

    console.log('Report summary:', g_reportData.summary);
    const currency = g_reportData.summary.currency || 'USD';
    const reportUnits = currentUnits || 'mm';
    // FIX: Use nullish coalescing operator (??) to correctly handle currentPrecision being 0
    const reportPrecision = currentPrecision ?? 1; 
    const currencySymbol = currencySymbols[currency] || currency;
    window.currentAreaUnits = window.currentAreaUnits || 'm2';

    const summaryTable = document.getElementById('summaryTable');
    if (summaryTable) {
        console.log('Rendering summary table');
        summaryTable.innerHTML = `
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Parts Instances</td><td>${g_reportData.summary.total_parts_instances || 0}</td></tr>
            <tr><td>Total Unique Part Types</td><td>${g_reportData.summary.total_unique_part_types || 0}</td></tr>
            <tr><td>Total Boards</td><td>${g_reportData.summary.total_boards || 0}</td></tr>
            <tr><td>Overall Efficiency</td><td>${formatNumber(g_reportData.summary.overall_efficiency || 0, reportPrecision)}%</td></tr>
            <tr><td><strong>Total Project Cost</strong></td><td class="total-highlight"><strong>${currencySymbol}${(g_reportData.summary.total_project_cost || 0).toFixed(2)}</strong></td></tr>
        `;
        addCopyButton('Overall Summary', 'summaryTable');
    } else {
        console.error('summaryTable element not found');
    }

    const materialsContainer = document.getElementById('materialsContainer');
    if (materialsContainer && g_reportData.unique_board_types) {
        let materialsHtml = `<table><tr><th>Material</th><th>Price</th></tr>`;
        g_reportData.unique_board_types.forEach(board_type => {
            const boardCurrency = board_type.currency || currency;
            const boardSymbol = currencySymbols[boardCurrency] || boardCurrency;
            materialsHtml += `<tr><td>${board_type.material}</td><td>${boardSymbol}${(board_type.price_per_sheet || 0).toFixed(2)}</td></tr>`;
        });
        materialsHtml += `</table>`;
        materialsContainer.innerHTML = materialsHtml;
        addCopyButton('Materials Used', 'materialsContainer');
    }

    const uniquePartTypesTable = document.getElementById('uniquePartTypesTable');
    if (uniquePartTypesTable) {
        console.log('Rendering unique part types table');
        let html = `<tr><th>Name</th><th style="width: 50px;">W (${reportUnits})</th><th style="width: 50px;">H (${reportUnits})</th><th style="width: 50px;">Thick (${reportUnits})</th><th>Material</th><th>Grain</th><th style="width: 50px;">Total Qty</th><th style="width: 60px;">Total Area</th></tr>`;
        if (g_reportData.unique_part_types && g_reportData.unique_part_types.length > 0) {
            console.log('Found', g_reportData.unique_part_types.length, 'unique part types');
            g_reportData.unique_part_types.forEach(part_type => {
                const width = part_type.width / unitFactors[reportUnits];
                const height = part_type.height / unitFactors[reportUnits];
                const thickness = part_type.thickness / unitFactors[reportUnits];
                
                // Use the global formatNumber function
                html += `
                    <tr>
                        <td title="${part_type.name}">${part_type.name}</td>
                        <td>${formatNumber(width, reportPrecision)}</td>
                        <td>${formatNumber(height, reportPrecision)}</td>
                        <td>${formatNumber(thickness, reportPrecision)}</td>
                        <td>${part_type.material}</td>
                        <td>${part_type.grain_direction}</td>
                        <td class="total-highlight">${part_type.total_quantity}</td>
                        <td>${getAreaDisplay(part_type.total_area, currentAreaUnits)}</td>
                    </tr>
                `;
            });
        }
        uniquePartTypesTable.innerHTML = html;
        addCopyButton('Unique Part Types', 'uniquePartTypesTable');
    } else {
        console.error('uniquePartTypesTable element not found');
    }

    // Sheet Inventory Summary Table
    const sheetInventoryTable = document.getElementById('sheetInventoryTable');
    if (sheetInventoryTable && g_reportData.unique_board_types) {
        let html = `<tr><th>Material</th><th>Dimensions</th><th>Count</th><th>Total Area</th><th>Price/Sheet</th><th>Total Cost</th></tr>`;
        g_reportData.unique_board_types.forEach(board_type => {
            const boardCurrency = board_type.currency || currency;
            const boardSymbol = currencySymbols[boardCurrency] || boardCurrency;
            const dimMatch = (board_type.dimensions_mm || board_type.dimensions || '2440 x 1220 mm').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
            const width = dimMatch ? parseFloat(dimMatch[1]) / unitFactors[reportUnits] : 2440 / unitFactors[reportUnits];
            const height = dimMatch ? parseFloat(dimMatch[2]) / unitFactors[reportUnits] : 1220 / unitFactors[reportUnits];
            const dimensionsStr = `${formatNumber(width, reportPrecision)} × ${formatNumber(height, reportPrecision)} ${reportUnits}`;
            
            html += `
                <tr>
                    <td>${board_type.material}</td>
                    <td>${dimensionsStr}</td>
                    <td class="total-highlight">${board_type.count}</td>
                    <td>${getAreaDisplay(board_type.total_area, currentAreaUnits)}</td>
                    <td>${boardSymbol}${(board_type.price_per_sheet || 0).toFixed(2)}</td>
                    <td class="total-highlight">${boardSymbol}${(board_type.total_cost || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        sheetInventoryTable.innerHTML = html;
        addCopyButton('Sheet Inventory Summary', 'sheetInventoryTable');
    }

    // Render cost breakdown in independent container
    const costBreakdownContainer = document.getElementById('costBreakdownContainer');
    if (costBreakdownContainer && g_reportData.parts_placed) {
        const parts_list = g_reportData.parts_placed || [];
        const boardTypeMap = {};
        g_reportData.unique_board_types.forEach(bt => {
            boardTypeMap[bt.material] = {
                price: bt.price_per_sheet || 0,
                currency: bt.currency || currency,
                area: parseFloat((bt.dimensions_mm || bt.dimensions || '2440 x 1220 mm').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i)?.[1] || 2440) * parseFloat((bt.dimensions_mm || bt.dimensions || '2440 x 1220 mm').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i)?.[2] || 1220)
            };
        });
        
        const materialCosts = {};
        let totalPartsCost = 0;
        
        parts_list.forEach(part => {
            const boardType = boardTypeMap[part.material] || { price: 0, currency: currency, area: 2976800 };
            const partArea = part.width * part.height;
            const costPerMm2 = boardType.price / boardType.area;
            const partCost = partArea * costPerMm2;
            
            if (!materialCosts[part.material]) {
                materialCosts[part.material] = { cost: 0, count: 0, currency: boardType.currency };
            }
            materialCosts[part.material].cost += partCost;
            materialCosts[part.material].count += 1;
            totalPartsCost += partCost;
        });
        
        const costs = parts_list.map(part => {
            const boardType = boardTypeMap[part.material] || { price: 0, currency: currency, area: 2976800 };
            const partArea = part.width * part.height;
            const costPerMm2 = boardType.price / boardType.area;
            return partArea * costPerMm2;
        }).filter(c => c > 0);
        
        const avgCost = costs.length > 0 ? totalPartsCost / costs.length : 0;
        const maxCost = Math.max(...costs, 0);
        const minCost = Math.min(...costs, maxCost);
        
        const costAnalysisHtml = `<div class="cost-analysis-independent">
            <strong>Cost Analysis:</strong> Avg: ${currencySymbol}${avgCost.toFixed(2)} | Min: ${currencySymbol}${minCost.toFixed(2)} | Max: ${currencySymbol}${maxCost.toFixed(2)}
        </div>`;
        
        let costTableHtml = `${costAnalysisHtml}<table><tr><th>Material</th><th>Parts</th><th>Cost</th><th>Percentage</th></tr>`;
        Object.entries(materialCosts).forEach(([material, data]) => {
            const percentage = totalPartsCost > 0 ? (data.cost / totalPartsCost * 100) : 0;
            const symbol = currencySymbols[data.currency] || data.currency;
            costTableHtml += `<tr><td>${material}</td><td>${data.count}</td><td>${symbol}${data.cost.toFixed(2)}</td><td>${percentage.toFixed(1)}%</td></tr>`;
        });
        costTableHtml += `<tr style="border-top: 2px solid #22863a; background: #f6ffed;"><td colspan="2" style="font-weight: bold;">Total</td><td style="font-weight: bold; color: #22863a;">${currencySymbol}${totalPartsCost.toFixed(2)}</td><td style="font-weight: bold;">100.0%</td></tr></table>`;
        
        costBreakdownContainer.innerHTML = costTableHtml;
        addCopyButton('Cost Breakdown', 'costBreakdownContainer');
    }



    const partsTable = document.getElementById('partsTable');
    if (partsTable) {
        console.log('Rendering parts table');
        
        // Calculate piece costs and statistics
        const parts_list = g_reportData.parts_placed || g_reportData.parts || [];
        const boardTypeMap = {};
        g_reportData.unique_board_types.forEach(bt => {
            boardTypeMap[bt.material] = {
                price: bt.price_per_sheet || 0,
                currency: bt.currency || currency,
                area: parseFloat((bt.dimensions_mm || bt.dimensions || '2440 x 1220 mm').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i)?.[1] || 2440) * parseFloat((bt.dimensions_mm || bt.dimensions || '2440 x 1220 mm').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i)?.[2] || 1220)
            };
        });
        
        const partsWithCosts = parts_list.map(part => {
            const boardType = boardTypeMap[part.material] || { price: 0, currency: currency, area: 2976800 };
            const partArea = part.width * part.height; // in mm²
            const costPerMm2 = boardType.price / boardType.area;
            const partCost = partArea * costPerMm2;
            return { ...part, cost: partCost, currency: boardType.currency };
        });
        
        const costs = partsWithCosts.map(p => p.cost).filter(c => c > 0);
        const totalPartsCost = costs.reduce((a, b) => a + b, 0);
        const avgCost = costs.length > 0 ? totalPartsCost / costs.length : 0;
        const maxCost = Math.max(...costs, 0);
        const minCost = Math.min(...costs, maxCost);
        
        let partsHtml = `<tr><th>ID</th><th>Name</th><th>Dimensions</th><th>Material</th><th>Board#</th><th>Cost</th><th>Level</th></tr>`;
        
        partsWithCosts.forEach(part => {
            const partId = part.part_unique_id || part.part_number;
            const width = part.width / unitFactors[reportUnits];
            const height = part.height / unitFactors[reportUnits];
            const dimensionsStr = `${formatNumber(width, reportPrecision)} × ${formatNumber(height, reportPrecision)} ${reportUnits}`;
            const partSymbol = currencySymbols[part.currency] || part.currency;
            
            let costLevel = 'avg', costColor = '#ffa500', costText = 'Average';
            if (part.cost > avgCost * 1.2) { costLevel = 'high'; costColor = '#ff4444'; costText = 'High'; }
            else if (part.cost < avgCost * 0.8) { costLevel = 'low'; costColor = '#44aa44'; costText = 'Low'; }
            
            partsHtml += `
                <tr data-part-id="${partId}" data-board-number="${part.board_number}" data-cost-level="${costLevel}">
                    <td><button class="part-id-btn" onclick="scrollToPieceDiagram('${partId}', ${part.board_number})">${partId}</button></td>
                    <td title="${part.name}">${part.name}</td>
                    <td>${dimensionsStr}</td>
                    <td title="${part.material}">${part.material}</td>
                    <td>${part.board_number}</td>
                    <td>${partSymbol}${part.cost.toFixed(2)}</td>
                    <td><span class="cost-indicator" style="background: ${costColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${costText}</span></td>
                </tr>
            `;
        });
        
        partsHtml += `
                <tr style="border-top: 2px solid #22863a; background: #f6ffed;">
                    <td colspan="5" style="text-align: right; font-weight: bold;">Total Parts Cost:</td>
                    <td style="font-weight: bold; color: #22863a;">${currencySymbol}${totalPartsCost.toFixed(2)}</td>
                    <td></td>
                </tr>
            `;
        
        // Remove existing cost analysis containers to prevent duplicates
        const existingAnalysis = partsTable.parentNode.querySelectorAll('.cost-analysis-isolated');
        existingAnalysis.forEach(el => el.remove());
        partsTable.innerHTML = partsHtml;
        attachPartTableClickHandlers();
        addCopyButton('Cut List & Part Details', 'partsTable');
    } else {
        console.error('partsTable element not found');
    }
    
    console.log('Finished rendering report');
}

function getMaterialColor(material) {
    let hash = 0;
    for (let i = 0; i < material.length; i++) {
        hash = material.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 80%)`;
}

function getMaterialTexture(material) {
    if (material.toLowerCase().includes('wood') || material.toLowerCase().includes('chestnut')) {
        return 'repeating-linear-gradient(45deg, #8B4513, #8B4513 2px, #A0522D 2px, #A0522D 4px)';
    } else if (material.includes('240,240,240')) {
        return 'repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 3px, #e0e0e0 3px, #e0e0e0 6px)';
    }
    return getMaterialColor(material);
}

function scrollToDiagram(material) {
    // Sanitize material name for ID matching
    const sanitizedMaterial = material.replace(/[^a-zA-Z0-9]/g, '_');
    const diagrams = document.querySelectorAll(`[id^="diagram-${sanitizedMaterial}-"]`);
    if (diagrams.length > 0) {
        diagrams[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function handleCanvasClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (canvas.partData) {
        for (let partData of canvas.partData) {
            if (x >= partData.x && x <= partData.x + partData.width &&
                y >= partData.y && y <= partData.y + partData.height) {
                showPartModal(partData.part);
                break;
            }
        }
    }
}

function handleCanvasHover(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let hovering = false;
    if (canvas.partData) {
        for (let partData of canvas.partData) {
            if (x >= partData.x && x <= partData.x + partData.width &&
                y >= partData.y && y <= partData.y + partData.height) {
                hovering = true;
                break;
            }
        }
    }
    canvas.style.cursor = hovering ? 'pointer' : 'default';
}

let scene, camera, renderer, controls, cube;
let showTexture = false, isOrthographic = false, currentPart = null;

function showPartModal(part) {
    const modal = document.getElementById('partModal');
    const modalCanvas = document.getElementById('modalCanvas');
    const modalInfo = document.getElementById('modalInfo');
    
    initThreeJS(part, modalCanvas);
    setupOrbitControls();
    
    const modalUnits = currentUnits || 'mm';
    // FIX: Use nullish coalescing operator (??) to correctly handle currentPrecision being 0
    const modalPrecision = currentPrecision ?? 1; 
    const width = part.width / unitFactors[modalUnits];
    const height = part.height / unitFactors[modalUnits];
    const thickness = part.thickness / unitFactors[modalUnits];
    
    // Use the global formatNumber function for dimensions in the modal
    modalInfo.innerHTML = `
        <h3>${part.name}</h3>
        <p><strong>Dimensions:</strong> ${formatNumber(width, modalPrecision)} × ${formatNumber(height, modalPrecision)} × ${formatNumber(thickness, modalPrecision)}${modalUnits}</p>
        <p><strong>Area:</strong> ${formatNumber((part.width * part.height / 1000000), 3)} m²</p> <!-- Area uses fixed 3 decimal places -->
        <p><strong>Material:</strong> ${part.material}</p>
        <p><strong>Grain Direction:</strong> ${part.grain_direction || 'Any'}</p>
        <p><strong>Rotated:</strong> ${part.rotated ? 'Yes' : 'No'}</p>
        <p style="color: #666; font-size: 12px;">Left drag: orbit | Middle/Shift+Left drag: pan | Scroll: zoom</p>
    `;
    
    document.getElementById('projectionToggle').onclick = () => {
        isOrthographic = !isOrthographic;
        document.getElementById('projectionToggle').textContent = isOrthographic ? 'Perspective' : 'Orthographic';
        
        if (isOrthographic) {
            const distance = camera.position.distanceTo(controls.target);
            camera = new THREE.OrthographicCamera(-distance, distance, distance, -distance, 0.1, 1000);
        } else {
            camera = new THREE.PerspectiveCamera(75, renderer.domElement.width / renderer.domElement.height, 0.1, 1000);
        }
        camera.position.set(5, 5, 5);
        controls.object = camera;
    };
    
    currentPart = part;
    modal.style.display = 'block';
    animate();
}

function initThreeJS(part, canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.width, canvas.height);
    
    const w = part.width / 100;
    const h = part.height / 100; 
    const d = part.thickness / 100;
    
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    cube = new THREE.Mesh(geometry, material);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    
    scene.add(cube);
    scene.add(wireframe);
}

function setupOrbitControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.minDistance = 1;
    controls.maxDistance = 50;
}

function animate() {
    if (!renderer || !scene || !camera) return;
    
    controls.update();
    renderer.render(scene, camera);
    
    if (document.getElementById('partModal').style.display === 'block') {
        requestAnimationFrame(animate);
    }
}

function attachPartTableClickHandlers() {
    // No additional styling needed - buttons are styled via CSS
}

function scrollToPieceDiagram(partId, boardNumber) {
    const diagramCards = document.querySelectorAll('.diagram-card');
    if (diagramCards.length >= boardNumber) {
        const targetCard = diagramCards[boardNumber - 1];
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        const canvas = targetCard.querySelector('canvas');
        if (canvas && canvas.partData) {
            const part = canvas.partData.find(p => p.part.instance_id === partId);
            if (part) {
                const ctx = canvas.getContext('2d');
                ctx.save();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.strokeRect(part.x - 2, part.y - 2, part.width + 4, part.height + 4);
                
                setTimeout(() => {
                    ctx.restore();
                    const board = g_boardsData[boardNumber - 1];
                    if (board && canvas.boardData) {
                        canvas.boardData = board;
                        const drawCanvas = canvas.drawCanvas;
                        if (drawCanvas) drawCanvas();
                    }
                }, 2000);
            }
        }
    }
}

function exportInteractiveHTML() {
    const reportContent = document.getElementById('reportContainer').innerHTML;
    const styles = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
            } catch (e) {
                return '';
            }
        }).join('\n');
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoNestCut Interactive Report</title>
    <style>${styles}</style>
</head>
<body>
    <div class="header">
        <h1>AutoNestCut Interactive Report</h1>
        <button onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="container">
        <div id="diagramsContainer" class="diagrams-container"></div>
        <div class="resizer" id="resizer"></div>
        <div id="reportContainer" class="report-container">
            ${reportContent}
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script>
        const g_boardsData = ${JSON.stringify(g_boardsData)};
        const g_reportData = ${JSON.stringify(g_reportData)};
        const currentUnits = '${currentUnits || 'mm'}';
        const currentPrecision = ${currentPrecision ?? 1};
        const unitFactors = ${JSON.stringify(unitFactors)};
        const currencySymbols = ${JSON.stringify(currencySymbols)};
        
        ${formatNumber.toString()}
        ${getMaterialColor.toString()}
        ${scrollToDiagram.toString()}
        ${scrollToPieceDiagram.toString()}
        ${highlightPieceOnCanvas.toString()}
        ${clearPieceHighlight.toString()}
        ${redrawCanvasDiagram.toString()}
        ${attachPartTableClickHandlers.toString()}
        ${renderDiagrams.toString()}
        ${initResizer.toString()}
        
        let currentHighlightedPiece = null;
        let currentHighlightedCanvas = null;
        
        document.addEventListener('DOMContentLoaded', function() {
            renderDiagrams();
            initResizer();
        });
    </script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AutoNestCut_Report.html';
    a.click();
    URL.revokeObjectURL(url);
}

function toggleTreeView() {
    const treeContainer = document.getElementById('treeStructure');
    const searchContainer = document.getElementById('treeSearchContainer');
    const button = document.getElementById('treeToggle');
    
    if (treeContainer.style.display === 'none') {
        renderTreeStructure();
        treeContainer.style.display = 'block';
        searchContainer.style.display = 'block';
        button.textContent = 'Hide Tree Structure';
    } else {
        treeContainer.style.display = 'none';
        searchContainer.style.display = 'none';
        button.textContent = 'Show Tree Structure';
    }
}

function renderTreeStructure() {
    const container = document.getElementById('treeStructure');
    if (!window.hierarchyTree || window.hierarchyTree.length === 0) {
        container.innerHTML = '<p>No hierarchy data available</p>';
        return;
    }
    
    let html = '<div class="tree-view">';
    window.hierarchyTree.forEach(component => {
        html += renderTreeNode(component, 0);
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderTreeNode(node, level) {
    const indent = level * 20;
    const hasChildren = node.children && node.children.length > 0;
    const expandIcon = hasChildren ? '▼' : '•';
    
    let html = `<div class="tree-node" style="margin-left: ${indent}px;">
        <span class="tree-expand" onclick="toggleNode(this)">${expandIcon}</span>
        <span class="tree-name">${node.name || 'Unnamed'}</span>
        <span class="tree-info">(${node.material || 'No material'})</span>
    </div>`;
    
    if (hasChildren) {
        html += '<div class="tree-children">';
        node.children.forEach(child => {
            html += renderTreeNode(child, level + 1);
        });
        html += '</div>';
    }
    
    return html;
}

function toggleNode(element) {
    const children = element.parentElement.nextElementSibling;
    if (children && children.classList.contains('tree-children')) {
        if (children.style.display === 'none') {
            children.style.display = 'block';
            element.textContent = '▼';
        } else {
            children.style.display = 'none';
            element.textContent = '▶';
        }
    }
}

function filterTree() {
    const search = document.getElementById('treeSearch').value.toLowerCase();
    const nodes = document.querySelectorAll('.tree-node');
    nodes.forEach(node => {
        const text = node.textContent.toLowerCase();
        node.style.display = text.includes(search) ? 'block' : 'none';
    });
}

function clearTreeSearch() {
    document.getElementById('treeSearch').value = '';
    filterTree();
}

function expandAll() {
    document.querySelectorAll('.tree-children').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.tree-expand').forEach(el => el.textContent = '▼');
}

function collapseAll() {
    document.querySelectorAll('.tree-children').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tree-expand').forEach(el => el.textContent = '▶');
}

function initResizer() {
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
}
function scrollToPieceDiagram(partId, boardNumber) {
    // Find the board diagram that contains this piece
    const boardIndex = boardNumber - 1; // Convert to 0-based index
    
    if (boardIndex < 0 || boardIndex >= g_boardsData.length) {
        console.warn(`Board ${boardNumber} not found`);
        return;
    }
    
    const board = g_boardsData[boardIndex];
    const diagramContainer = document.getElementById('diagramsContainer');
    
    if (!diagramContainer) {
        console.warn('Diagrams container not found');
        return;
    }
    
    // Find the canvas for this board
    const diagrams = diagramContainer.querySelectorAll('.diagram-card');
    let targetCanvas = null;
    let targetCard = null;
    
    if (boardIndex < diagrams.length) {
        targetCard = diagrams[boardIndex];
        targetCanvas = targetCard.querySelector('canvas');
    }
    
    if (!targetCanvas) {
        console.warn(`Canvas for board ${boardNumber} not found`);
        return;
    }
    
    // Clear previous highlight
    clearPieceHighlight();
    
    // Find the piece in the canvas data
    if (targetCanvas.partData) {
        for (let partData of targetCanvas.partData) {
            const partLabel = String(partData.part.instance_id || `P${partData.part.index || 0}`);
            if (partLabel === partId) {
                // Highlight this piece on the canvas
                highlightPieceOnCanvas(targetCanvas, partData);
                currentHighlightedPiece = partId;
                currentHighlightedCanvas = targetCanvas;
                break;
            }
        }
    }
    
    // Scroll the diagram card into view
    if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function highlightPieceOnCanvas(canvas, partData) {
    // Redraw the canvas with the piece highlighted
    const ctx = canvas.getContext('2d');

    // Store original drawing function if not already stored
    if (!canvas.originalDraw) {
        canvas.originalDraw = canvas.toDataURL();
    }

    // Add a visual highlight by drawing a border around the piece
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;

    // Draw highlight border
    ctx.strokeRect(
        partData.x - 2,
        partData.y - 2,
        partData.width + 4,
        partData.height + 4
    );
}

function addCopyButton(title, tableId) {
    const h2 = document.querySelector(`h2:has(+ .table-wrapper #${tableId}), h2:has(+ table#${tableId}), h2:has(+ #${tableId}), h2:has(+ .tree-controls), h2:has(+ .cost-analysis-isolated)`);
    if (h2 && !h2.querySelector('.copy-table-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-table-btn';
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>Markdown`;
        copyBtn.onclick = () => copyTableAsMarkdown(tableId, copyBtn);
        h2.appendChild(copyBtn);
    }
}

function copyTableAsMarkdown(tableId, button) {
    const container = document.getElementById(tableId);
    if (!container) return;
    
    const table = container.tagName === 'TABLE' ? container : container.querySelector('table');
    if (!table) return;
    
    let markdown = '';
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

function clearPieceHighlight() {
    if (currentHighlightedCanvas) {
        // Redraw the canvas to remove highlight
        const board = g_boardsData[currentHighlightedCanvas.boardIndex];
        if (board) {
            // Redraw the entire diagram
            redrawCanvasDiagram(currentHighlightedCanvas, board);
        }
        currentHighlightedCanvas = null;
        currentHighlightedPiece = null;
    }
}

function redrawCanvasDiagram(canvas, board) {
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const maxCanvasDim = 600;
    const scale = Math.min(
        (maxCanvasDim - 2 * padding) / board.stock_width,
        (maxCanvasDim - 2 * padding) / board.stock_height
    );

    canvas.width = board.stock_width * scale + 2 * padding;
    canvas.height = board.stock_height * scale + 2 * padding;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(padding, padding, board.stock_width * scale, board.stock_height * scale);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, board.stock_width * scale, board.stock_height * scale);
    
    ctx.fillStyle = '#333';
    ctx.font = `${Math.max(12, 14 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${board.stock_width.toFixed(0)}mm`, padding + (board.stock_width * scale) / 2, padding - 5);
    
    ctx.save();
    ctx.translate(padding - 15, padding + (board.stock_height * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${board.stock_height.toFixed(0)}mm`, 0, 0);
    ctx.restore();

    const parts = board.parts || [];
    canvas.partData = [];
    
    parts.forEach((part, partIndex) => {
        const partX = padding + part.x * scale;
        const partY = padding + part.y * scale;
        const partWidth = part.width * scale;
        const partHeight = part.height * scale;

        ctx.fillStyle = getMaterialColor(part.material);
        ctx.fillRect(partX, partY, partWidth, partHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(partX, partY, partWidth, partHeight);

        canvas.partData.push({
            x: partX, y: partY, width: partWidth, height: partHeight,
            part: part, boardIndex: board.index || 0
        });

        if (partWidth > 30 && partHeight > 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(12, 14 * scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelContent = String(part.instance_id || `P${partIndex + 1}`);
            const maxChars = Math.max(6, Math.floor(partWidth / 8));
            const displayLabel = labelContent.length > maxChars ? labelContent.slice(0, maxChars - 1) + '…' : labelContent;
            ctx.fillText(displayLabel, partX + partWidth / 2, partY + partHeight / 2);
        }

        if (partWidth > 50) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(10, 11 * scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${Math.round(part.width)}mm`, partX + partWidth / 2, partY + 5);
        }

        if (partHeight > 50) {
            ctx.save();
            ctx.translate(partX + 5, partY + partHeight / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(10, 11 * scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${Math.round(part.height)}mm`, 0, 0);
            ctx.restore();
        }
    });
}