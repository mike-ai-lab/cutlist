function callRuby(method, args) {
    if (typeof sketchup === 'object' && sketchup[method]) {
        sketchup[method](args);
    } else {
        console.log('Ruby call:', method, args);
    }
}

let g_boardsData = [];
let g_reportData = null;

function receiveData(data) {
    console.log('Received data:', data);
    g_boardsData = data.diagrams;
    g_reportData = data.report;
    window.originalComponents = data.original_components || [];
    window.hierarchyTree = data.hierarchy_tree || [];
    
    renderDiagrams();
    renderReport();
}

function renderDiagrams() {
    const container = document.getElementById('diagramsContainer');
    container.innerHTML = '';

    if (!g_boardsData || g_boardsData.length === 0) {
        container.innerHTML = '<p>No cutting diagrams to display.</p>';
        return;
    }

    g_boardsData.forEach((board, boardIndex) => {
        const card = document.createElement('div');
        card.className = 'diagram-card';

        const title = document.createElement('h3');
        title.textContent = `${board.material} Board ${boardIndex + 1}`;
        title.id = `diagram-${board.material.replace(/[^a-zA-Z0-9]/g, '_')}-${boardIndex}`;
        card.appendChild(title);

        const info = document.createElement('p');
        info.innerHTML = `Size: ${board.stock_width.toFixed(1)}x${board.stock_height.toFixed(1)}mm<br>
                          Waste: ${board.waste_percentage.toFixed(1)}% (Efficiency: ${board.efficiency_percentage.toFixed(1)}%)`;
        card.appendChild(info);

        const canvas = document.createElement('canvas');
        canvas.className = 'diagram-canvas';
        card.appendChild(canvas);

        container.appendChild(card);

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

            canvas.partData = canvas.partData || [];
            canvas.partData.push({
                x: partX, y: partY, width: partWidth, height: partHeight,
                part: part, boardIndex: boardIndex
            });

            if (partWidth > 30 && partHeight > 20) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelContent = part.instance_id || `P${partIndex + 1}`;
                ctx.fillText(labelContent, partX + partWidth / 2, partY + partHeight / 2);
            }
            
            if (partWidth > 50) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`${part.width.toFixed(0)}mm`, partX + partWidth / 2, partY + 5);
            }
            
            if (partHeight > 50) {
                ctx.save();
                ctx.translate(partX + 5, partY + partHeight / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = '#000';
                ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`${part.height.toFixed(0)}mm`, 0, 0);
                ctx.restore();
            }
        });

        canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas));
        canvas.addEventListener('mousemove', (e) => handleCanvasHover(e, canvas));
        canvas.style.cursor = 'pointer';
    });
}

function renderReport() {
    if (!g_reportData) return;

    const summaryTable = document.getElementById('summaryTable');
    summaryTable.innerHTML = `
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Parts Instances</td><td>${g_reportData.summary.total_parts_instances || 0}</td></tr>
        <tr><td>Total Unique Part Types</td><td>${g_reportData.summary.total_unique_part_types || 0}</td></tr>
        <tr><td>Total Boards</td><td>${g_reportData.summary.total_boards || 0}</td></tr>
        <tr><td>Overall Efficiency</td><td>${(g_reportData.summary.overall_efficiency || 0).toFixed(2)}%</td></tr>
        <tr><td><strong>Total Project Cost</strong></td><td class="total-highlight"><strong>$${(g_reportData.summary.total_project_cost || 0).toFixed(2)}</strong></td></tr>
    `;

    const materialsContainer = document.getElementById('materialsContainer');
    if (materialsContainer && g_reportData.unique_board_types) {
        materialsContainer.innerHTML = g_reportData.unique_board_types.map((board_type, index) => `
            <div class="material-item" onclick="scrollToDiagram('${board_type.material}')" style="cursor: pointer;">
                <div class="material-swatch" style="background: ${getMaterialColor(board_type.material)}"></div>
                <span class="material-name">${board_type.material}</span>
                <span class="material-price">Price: $${(board_type.price_per_sheet || 0).toFixed(2)}</span>
            </div>
        `).join('');
    }

    const uniquePartTypesTable = document.getElementById('uniquePartTypesTable');
    if (uniquePartTypesTable) {
        uniquePartTypesTable.innerHTML = `
            <tr><th>Name</th><th>W (mm)</th><th>H (mm)</th><th>Thick (mm)</th><th>Material</th><th>Grain</th><th>Total Qty</th><th>Total Area (m²)</th></tr>
        `;
        if (g_reportData.unique_part_types) {
            g_reportData.unique_part_types.forEach(part_type => {
                uniquePartTypesTable.innerHTML += `
                    <tr>
                        <td>${part_type.name}</td>
                        <td>${part_type.width.toFixed(2)}</td>
                        <td>${part_type.height.toFixed(2)}</td>
                        <td>${part_type.thickness.toFixed(2)}</td>
                        <td>${part_type.material}</td>
                        <td>${part_type.grain_direction}</td>
                        <td class="total-highlight">${part_type.total_quantity}</td>
                        <td>${(part_type.total_area / 1000000).toFixed(3)}</td>
                    </tr>
                `;
            });
        }
    }

    const uniqueBoardTypesTable = document.getElementById('uniqueBoardTypesTable');
    if (uniqueBoardTypesTable) {
        uniqueBoardTypesTable.innerHTML = `
            <tr><th>Material</th><th>Dimensions</th><th>Count</th><th>Total Area (m²)</th><th>Price/Sheet</th><th>Total Cost</th></tr>
        `;
        if (g_reportData.unique_board_types) {
            g_reportData.unique_board_types.forEach(board_type => {
                uniqueBoardTypesTable.innerHTML += `
                    <tr>
                        <td>${board_type.material}</td>
                        <td>${board_type.dimensions}</td>
                        <td class="total-highlight">${board_type.count}</td>
                        <td>${(board_type.total_area / 1000000).toFixed(3)}</td>
                        <td>$${(board_type.price_per_sheet || 0).toFixed(2)}</td>
                        <td class="total-highlight">$${(board_type.total_cost || 0).toFixed(2)}</td>
                    </tr>
                `;
            });
        }
    }

    const boardsTable = document.getElementById('boardsTable');
    boardsTable.innerHTML = `
        <tr><th>Board#</th><th>Material</th><th>Size</th><th>Parts</th><th>Efficiency</th></tr>
    `;
    if (g_reportData.boards) {
        g_reportData.boards.forEach(board => {
            boardsTable.innerHTML += `
                <tr>
                    <td>${board.board_number}</td>
                    <td>${board.material}</td>
                    <td>${board.stock_size}</td>
                    <td class="total-highlight">${board.parts_count}</td>
                    <td>${board.efficiency.toFixed(2)}%</td>
                </tr>
            `;
        });
    }

    const partsTable = document.getElementById('partsTable');
    partsTable.innerHTML = `
        <tr><th>Unique ID</th><th>Name</th><th>Dimensions</th><th>Material</th><th>Board#</th></tr>
    `;
    const parts_list = g_reportData.parts_placed || g_reportData.parts || [];
    parts_list.forEach(part => {
        partsTable.innerHTML += `
            <tr>
                <td>${part.part_unique_id || part.part_number}</td>
                <td>${part.name}</td>
                <td>${part.width.toFixed(0)} × ${part.height.toFixed(0)}mm</td>
                <td>${part.material}</td>
                <td>${part.board_number}</td>
            </tr>
        `;
    });
}

function getMaterialColor(material) {
    let hash = 0;
    for (let i = 0; i < material.length; i++) {
        hash = material.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 65%)`;
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
    
    modalInfo.innerHTML = `
        <h3>${part.name}</h3>
        <p><strong>Dimensions:</strong> ${part.width.toFixed(1)} × ${part.height.toFixed(1)} × ${part.thickness.toFixed(1)}mm</p>
        <p><strong>Area:</strong> ${(part.width * part.height / 1000000).toFixed(3)} m²</p>
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

let resizerInitialized = false;

function initResizer() {
    const resizer = document.getElementById('resizer');
    const leftSide = document.getElementById('diagramsContainer');
    const rightSide = document.getElementById('reportContainer');
    
    if (!resizer || !leftSide || !rightSide || resizerInitialized) return;
    
    let isResizing = false;
    resizerInitialized = true;
    
    resizer.style.cursor = 'col-resize';
    
    function handleMouseMove(e) {
        if (!isResizing) return;
        e.preventDefault();
        
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const leftWidth = e.clientX - containerRect.left;
        const totalWidth = containerRect.width;
        const leftPercent = (leftWidth / totalWidth) * 100;
        const rightPercent = 100 - leftPercent;
        
        if (leftPercent > 15 && rightPercent > 25) {
            leftSide.style.flex = `0 0 ${leftPercent}%`;
            rightSide.style.flex = `0 0 ${rightPercent}%`;
        }
    }
    
    function handleMouseUp() {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer.style.cursor = 'col-resize';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    resizer.addEventListener('mouseenter', () => {
        if (!isResizing) {
            resizer.style.cursor = 'col-resize';
        }
    });
}

function exportInteractiveHTML() {
    if (!g_boardsData || g_boardsData.length === 0 || !g_reportData) {
        alert('No data to export. Please generate a report first.');
        return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AutoNestCut Interactive Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .container { display: flex; gap: 20px; }
        .diagrams-container { flex: 1; }
        .report-container { flex: 1; }
        .resizer { width: 5px; background: #ddd; cursor: col-resize; flex-shrink: 0; }
        .diagram-card { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
        .diagram-canvas { border: 1px solid #ccc; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.8em; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.4); }
        .modal-content { background-color: #fefefe; margin: 2% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 900px; max-height: 90vh; overflow-y: auto; }
        .modal-controls { margin-bottom: 10px; }
        .modal-controls button { margin-right: 10px; padding: 5px 10px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
        #modalCanvas { border: 1px solid #ddd; }
        #modalInfo { margin-top: 15px; }
        .material-item { display: flex; align-items: center; margin: 5px 0; cursor: pointer; }
        .material-swatch { width: 20px; height: 20px; margin-right: 10px; border: 1px solid #ccc; }
        .total-highlight { font-weight: bold; }
    </style>
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
            <h2>Overall Summary</h2>
            <table id="summaryTable"></table>
            <h2>Materials Used</h2>
            <div id="materialsContainer"></div>
            <h2>Unique Part Types</h2>
            <table id="uniquePartTypesTable"></table>
            <h2>Unique Board Types</h2>
            <table id="uniqueBoardTypesTable"></table>
            <h2>Boards Summary</h2>
            <table id="boardsTable"></table>
            <h2>Parts Placed (Detailed)</h2>
            <table id="partsTable"></table>
        </div>
    </div>
    <div id="partModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-controls">
                <button id="projectionToggle">Orthographic</button>
            </div>
            <canvas id="modalCanvas" width="500" height="400"></canvas>
            <div id="modalInfo"></div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script>
        let g_boardsData = ${JSON.stringify(g_boardsData)};
        let g_reportData = ${JSON.stringify(g_reportData)};
        ${getCompleteJSContent()}
        document.addEventListener('DOMContentLoaded', () => {
            renderDiagrams();
            renderReport();
            const modal = document.getElementById('partModal');
            const closeBtn = document.querySelector('.close');
            if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
            initResizer();
        });
    </script>
</body>
</html>`;

    downloadHTML(htmlContent, 'AutoNestCut_Interactive_Report.html');
}

function getCompleteJSContent() {
    const smoothScrollToDiagram = `function scrollToDiagram(material) {
        const sanitizedMaterial = material.replace(/[^a-zA-Z0-9]/g, '_');
        const diagrams = document.querySelectorAll(\`[id^="diagram-\${sanitizedMaterial}-"]\`);
        if (diagrams.length > 0) {
            diagrams[0].style.scrollMarginTop = '20px';
            diagrams[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => diagrams[0].style.scrollMarginTop = '', 800);
        }
    }`;
    return `${renderDiagrams.toString()}\n${renderReport.toString()}\n${getMaterialColor.toString()}\n${getMaterialTexture.toString()}\n${smoothScrollToDiagram}\n${handleCanvasClick.toString()}\n${handleCanvasHover.toString()}\n${showPartModal.toString()}\n${initThreeJS.toString()}\n${setupOrbitControls.toString()}\n${animate.toString()}\n${initResizer.toString()}`;
}

function downloadHTML(content, filename) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Interactive HTML report exported successfully!');
}

let showTreeView = false;
let treeNodeId = 0;
let expandedNodes = new Set();
let searchTerm = '';

function toggleTreeView() {
    showTreeView = !showTreeView;
    const button = document.getElementById('treeToggle');
    const treeContainer = document.getElementById('treeStructure');
    const searchContainer = document.getElementById('treeSearchContainer');
    
    if (showTreeView) {
        button.textContent = 'Hide Tree Structure';
        treeContainer.style.display = 'block';
        searchContainer.style.display = 'flex';
        renderTreeStructure();
    } else {
        button.textContent = 'Show Tree Structure';
        treeContainer.style.display = 'none';
        searchContainer.style.display = 'none';
    }
}

function renderTreeStructure() {
    const container = document.getElementById('treeStructure');
    if (!window.hierarchyTree || window.hierarchyTree.length === 0) {
        container.innerHTML = '<p>No hierarchy data available.</p>';
        return;
    }
    
    treeNodeId = 0;
    let html = '<div class="tree-header">Model Structure:</div>';
    
    window.hierarchyTree.forEach(node => {
        html += renderTreeNode(node, 0);
    });
    
    container.innerHTML = html;
    
    if (searchTerm) {
        filterTreeNodes();
    }
}

function renderTreeNode(node, level) {
    const nodeId = `tree-node-${treeNodeId++}`;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(nodeId);
    
    let html = '';
    
    if (node.type === 'group' || (node.type === 'component' && hasChildren)) {
        const expandIcon = isExpanded ? '▼' : '▶';
        const folderIcon = node.type === 'group' ? '📁' : '📦';
        
        html += `<div class="tree-node" data-node-id="${nodeId}" data-level="${level}">`;
        html += `<div class="tree-item tree-expandable" style="padding-left: ${level * 20}px;" onclick="toggleNode('${nodeId}')">`;  
        html += `<span class="expand-icon">${expandIcon}</span>`;
        html += `<span class="node-icon">${folderIcon}</span>`;
        html += `<span class="node-name">${node.name}</span>`;
        if (node.dimensions) {
            html += `<span class="node-dimensions">(${node.dimensions})</span>`;
        }
        if (node.material && node.material !== 'Container' && node.material !== 'Assembly') {
            html += `<span class="node-material"> - ${node.material}</span>`;
        }
        html += `</div>`;
        
        if (hasChildren) {
            html += `<div class="tree-children" id="children-${nodeId}" style="display: ${isExpanded ? 'block' : 'none'};">`;
            node.children.forEach(child => {
                html += renderTreeNode(child, level + 1);
            });
            html += `</div>`;
        }
        html += `</div>`;
    } else {
        html += `<div class="tree-node" data-node-id="${nodeId}" data-level="${level}">`;
        html += `<div class="tree-item tree-component" style="padding-left: ${level * 20 + 20}px;">`;
        html += `<span class="node-icon">🔲</span>`;
        html += `<span class="node-name">${node.name}</span>`;
        if (node.dimensions) {
            html += `<span class="node-dimensions">(${node.dimensions})</span>`;
        }
        if (node.material && node.material !== 'Assembly') {
            html += `<span class="node-material"> - ${node.material}</span>`;
        }
        html += `</div></div>`;
    }
    
    return html;
}

function toggleNode(nodeId) {
    const childrenContainer = document.getElementById(`children-${nodeId}`);
    const expandIcon = document.querySelector(`[data-node-id="${nodeId}"] .expand-icon`);
    
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
        childrenContainer.style.display = 'none';
        expandIcon.textContent = '▶';
    } else {
        expandedNodes.add(nodeId);
        childrenContainer.style.display = 'block';
        expandIcon.textContent = '▼';
    }
}

function expandAll() {
    document.querySelectorAll('.tree-children').forEach(child => {
        child.style.display = 'block';
    });
    document.querySelectorAll('.expand-icon').forEach(icon => {
        icon.textContent = '▼';
    });
    document.querySelectorAll('.tree-node').forEach(node => {
        expandedNodes.add(node.dataset.nodeId);
    });
}

function collapseAll() {
    document.querySelectorAll('.tree-children').forEach(child => {
        child.style.display = 'none';
    });
    document.querySelectorAll('.expand-icon').forEach(icon => {
        icon.textContent = '▶';
    });
    expandedNodes.clear();
}

function filterTree() {
    searchTerm = document.getElementById('treeSearch').value.toLowerCase();
    filterTreeNodes();
}

function filterTreeNodes() {
    const nodes = document.querySelectorAll('.tree-node');
    
    if (!searchTerm) {
        nodes.forEach(node => {
            node.style.display = 'block';
            node.classList.remove('search-highlight');
        });
        return;
    }
    
    nodes.forEach(node => {
        const nameElement = node.querySelector('.node-name');
        const materialElement = node.querySelector('.node-material');
        const dimensionsElement = node.querySelector('.node-dimensions');
        
        let matches = false;
        let text = '';
        
        if (nameElement) {
            text += nameElement.textContent.toLowerCase();
        }
        if (materialElement) {
            text += materialElement.textContent.toLowerCase();
        }
        if (dimensionsElement) {
            text += dimensionsElement.textContent.toLowerCase();
        }
        
        matches = text.includes(searchTerm);
        
        if (matches) {
            node.style.display = 'block';
            node.classList.add('search-highlight');
            expandParentNodes(node);
        } else {
            node.style.display = 'none';
            node.classList.remove('search-highlight');
        }
    });
}

function expandParentNodes(node) {
    let parent = node.parentElement;
    while (parent && parent.classList.contains('tree-children')) {
        parent.style.display = 'block';
        const parentNode = parent.previousElementSibling;
        if (parentNode && parentNode.querySelector('.expand-icon')) {
            parentNode.querySelector('.expand-icon').textContent = '▼';
            const nodeId = parent.id.replace('children-', '');
            expandedNodes.add(nodeId);
        }
        parent = parent.parentElement.parentElement;
    }
}

function clearTreeSearch() {
    document.getElementById('treeSearch').value = '';
    searchTerm = '';
    filterTreeNodes();
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('partModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    initResizer();
    setTimeout(() => {
        callRuby('ready');
    }, 100);
});