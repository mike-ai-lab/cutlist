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
        card.appendChild(title);

        const info = document.createElement('p');
        info.innerHTML = `Size: ${board.stock_width.toFixed(1)}x${board.stock_height.toFixed(1)}mm<br>
                          Waste: ${board.waste_percentage.toFixed(1)}% (Efficiency: ${board.efficiency_percentage.toFixed(1)}%)`;
        card.appendChild(info);

        const canvas = document.createElement('canvas');
        canvas.className = 'diagram-canvas';
        card.appendChild(canvas);

        container.appendChild(card);

        // Canvas Drawing
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const maxCanvasDim = 600;
        const scale = Math.min(
            (maxCanvasDim - 2 * padding) / board.stock_width,
            (maxCanvasDim - 2 * padding) / board.stock_height
        );

        canvas.width = board.stock_width * scale + 2 * padding;
        canvas.height = board.stock_height * scale + 2 * padding;

        // Draw Board Outline (grayscale)
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(padding, padding, board.stock_width * scale, board.stock_height * scale);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, board.stock_width * scale, board.stock_height * scale);
        
        // Add board dimensions as text on the board
        ctx.fillStyle = '#333';
        ctx.font = `${Math.max(12, 14 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${board.stock_width.toFixed(0)}mm`, padding + (board.stock_width * scale) / 2, padding - 5);
        
        ctx.save();
        ctx.translate(padding - 15, padding + (board.stock_height * scale) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${board.stock_height.toFixed(0)}mm`, 0, 0);
        ctx.restore();

        // Draw Parts
        const parts = board.parts || [];
        parts.forEach((part, partIndex) => {
            const partX = padding + part.x * scale;
            const partY = padding + part.y * scale;
            const partWidth = part.width * scale;
            const partHeight = part.height * scale;

            // Blue part fill
            ctx.fillStyle = 'rgb(116, 185, 255)';
            ctx.fillRect(partX, partY, partWidth, partHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(partX, partY, partWidth, partHeight);

            // Store part data for click detection
            canvas.partData = canvas.partData || [];
            canvas.partData.push({
                x: partX, y: partY, width: partWidth, height: partHeight,
                part: part, boardIndex: boardIndex
            });

            // Add part ID in center - properly aligned
            if (partWidth > 30 && partHeight > 20) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelContent = part.instance_id || `P${partIndex + 1}`;
                ctx.fillText(labelContent, partX + partWidth / 2, partY + partHeight / 2);
            }
            
            // Add width dimension (horizontal) - inside piece
            if (partWidth > 50) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`${part.width.toFixed(0)}mm`, partX + partWidth / 2, partY + 5);
            }
            
            // Add height dimension (vertical) - inside piece
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

        // Add click event listener
        canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas));
        canvas.addEventListener('mousemove', (e) => handleCanvasHover(e, canvas));
        canvas.style.cursor = 'pointer';
    });
}

function getPartColor(partIndex) {
    const colors = [
        'rgba(255,0,0,0.6)', 'rgba(0,0,255,0.6)', 'rgba(0,255,0,0.6)', 'rgba(255,255,0,0.6)',
        'rgba(255,165,0,0.6)', 'rgba(128,0,128,0.6)', 'rgba(0,255,255,0.6)', 'rgba(255,0,255,0.6)'
    ];
    return colors[partIndex % colors.length];
}

function renderReport() {
    if (!g_reportData) return;

    // Summary Table
    const summaryTable = document.getElementById('summaryTable');
    summaryTable.innerHTML = `
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Parts Instances</td><td>${g_reportData.summary.total_parts_instances || 0}</td></tr>
        <tr><td>Total Unique Part Types</td><td>${g_reportData.summary.total_unique_part_types || 0}</td></tr>
        <tr><td>Total Boards</td><td>${g_reportData.summary.total_boards || 0}</td></tr>
        <tr><td>Overall Efficiency</td><td>${(g_reportData.summary.overall_efficiency || 0).toFixed(2)}%</td></tr>
    `;

    // Unique Part Types Table
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
                        <td>${part_type.total_quantity}</td>
                        <td>${(part_type.total_area / 1000000).toFixed(3)}</td>
                    </tr>
                `;
            });
        }
    }

    // Unique Board Types Table
    const uniqueBoardTypesTable = document.getElementById('uniqueBoardTypesTable');
    if (uniqueBoardTypesTable) {
        uniqueBoardTypesTable.innerHTML = `
            <tr><th>Material</th><th>Dimensions</th><th>Count</th><th>Total Area (m²)</th></tr>
        `;
        if (g_reportData.unique_board_types) {
            g_reportData.unique_board_types.forEach(board_type => {
                uniqueBoardTypesTable.innerHTML += `
                    <tr>
                        <td>${board_type.material}</td>
                        <td>${board_type.dimensions}</td>
                        <td>${board_type.count}</td>
                        <td>${(board_type.total_area / 1000000).toFixed(3)}</td>
                    </tr>
                `;
            });
        }
    }

    // Boards Table
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
                    <td>${board.parts_count}</td>
                    <td>${board.efficiency.toFixed(2)}%</td>
                </tr>
            `;
        });
    }

    // Materials Used Section
    const materialsContainer = document.getElementById('materialsContainer');
    if (materialsContainer && g_reportData.unique_part_types) {
        const materials = [...new Set(g_reportData.unique_part_types.map(p => p.material))];
        materialsContainer.innerHTML = materials.map(material => `
            <div class="material-item">
                <div class="material-swatch" style="background: ${getMaterialTexture(material)}"></div>
                <span class="material-name">${material}</span>
            </div>
        `).join('');
    }

    // Parts Placed Table (removed position and rotated columns)
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
    // Generate consistent colors based on material name
    let hash = 0;
    for (let i = 0; i < material.length; i++) {
        hash = material.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 65%)`;
}

function getMaterialTexture(material) {
    // Create a simple pattern based on material name
    if (material.toLowerCase().includes('wood') || material.toLowerCase().includes('chestnut')) {
        return 'repeating-linear-gradient(45deg, #8B4513, #8B4513 2px, #A0522D 2px, #A0522D 4px)';
    } else if (material.includes('240,240,240')) {
        return 'repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 3px, #e0e0e0 3px, #e0e0e0 6px)';
    }
    return getMaterialColor(material);
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
    
    // Set modal info
    modalInfo.innerHTML = `
        <h3>${part.name}</h3>
        <p><strong>Dimensions:</strong> ${part.width.toFixed(1)} × ${part.height.toFixed(1)} × ${part.thickness.toFixed(1)}mm</p>
        <p><strong>Area:</strong> ${(part.width * part.height / 1000000).toFixed(3)} m²</p>
        <p><strong>Material:</strong> ${part.material}</p>
        <p><strong>Grain Direction:</strong> ${part.grain_direction || 'Any'}</p>
        <p><strong>Rotated:</strong> ${part.rotated ? 'Yes' : 'No'}</p>
        <p style="color: #666; font-size: 12px;">Left drag: orbit | Middle/Shift+Left drag: pan | Scroll: zoom</p>
    `;
    
    // Setup button controls
    document.getElementById('textureToggle').onclick = () => {
        showTexture = !showTexture;
        document.getElementById('textureToggle').textContent = showTexture ? 'Blue Color' : 'Material Texture';
    };
    
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

function createMaterialTexture(material) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (material.toLowerCase().includes('wood') || material.toLowerCase().includes('chestnut')) {
        // Wood grain pattern
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 256; i += 4) {
            ctx.fillRect(0, i, 256, 2);
        }
    } else {
        // Generic material pattern
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#A9A9A9';
        for (let i = 0; i < 256; i += 8) {
            ctx.fillRect(i, 0, 4, 256);
            ctx.fillRect(0, i, 256, 4);
        }
    }
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

function initThreeJS(part, canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.width, canvas.height);
    
    // Create box with part dimensions
    const w = part.width / 100;
    const h = part.height / 100; 
    const d = part.thickness / 100;
    
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    cube = new THREE.Mesh(geometry, material);
    
    // Add subtle edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    
    scene.add(cube);
    scene.add(wireframe);
}

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
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



// Resizer functionality
function initResizer() {
    const resizer = document.getElementById('resizer');
    const leftSide = document.getElementById('diagramsContainer');
    const rightSide = document.getElementById('reportContainer');
    
    let isResizing = false;
    
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
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }
    
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('printButton').addEventListener('click', () => {
        document.title = 'AutoNestCut_Report';
        window.print();
    });

    document.getElementById('exportCsvButton').addEventListener('click', () => {
        callRuby('export_csv');
    });

    // Modal close functionality
    const modal = document.getElementById('partModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    initResizer();
    callRuby('ready');
});