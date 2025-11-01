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

let gl, program, rotationX = 0, rotationY = 0, zoom = 5, panX = 0, panY = 0;
let isDragging = false, isPanning = false, lastMouseX, lastMouseY;

function showPartModal(part) {
    const modal = document.getElementById('partModal');
    const modalCanvas = document.getElementById('modalCanvas');
    const modalInfo = document.getElementById('modalInfo');
    
    // Initialize WebGL
    gl = modalCanvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported');
        return;
    }
    
    initWebGL(part);
    setupMouseControls(modalCanvas);
    
    // Set modal info
    modalInfo.innerHTML = `
        <h3>${part.name}</h3>
        <p><strong>Dimensions:</strong> ${part.width.toFixed(1)} × ${part.height.toFixed(1)} × ${part.thickness.toFixed(1)}mm</p>
        <p><strong>Area:</strong> ${(part.width * part.height / 1000000).toFixed(3)} m²</p>
        <p><strong>Material:</strong> ${part.material}</p>
        <p><strong>Grain Direction:</strong> ${part.grain_direction || 'Any'}</p>
        <p><strong>Rotated:</strong> ${part.rotated ? 'Yes' : 'No'}</p>
        <p style="color: #666; font-size: 12px;">Left drag: rotate | Right drag: pan | Scroll: zoom</p>
    `;
    
    modal.style.display = 'block';
    animate(part);
}

function initWebGL(part) {
    const vertexShaderSource = `
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShaderSource = `
        precision mediump float;
        uniform vec3 color;
        void main() {
            gl_FragColor = vec4(color, 1.0);
        }
    `;
    
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(vertexShader, fragmentShader);
    
    // Create box geometry with actual dimensions
    const w = part.width / 100; // Scale down for display
    const h = part.height / 100;
    const d = part.thickness / 100;
    
    const vertices = new Float32Array([
        -w/2, -h/2, -d/2,  w/2, -h/2, -d/2,  w/2,  h/2, -d/2, -w/2,  h/2, -d/2, // Front
        -w/2, -h/2,  d/2,  w/2, -h/2,  d/2,  w/2,  h/2,  d/2, -w/2,  h/2,  d/2, // Back
    ]);
    
    const indices = new Uint16Array([
        0,1,2, 0,2,3, 4,7,6, 4,6,5, 0,4,5, 0,5,1, 2,6,7, 2,7,3, 0,3,7, 0,7,4, 1,5,6, 1,6,2
    ]);
    
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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

function setupMouseControls(canvas) {
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left click - rotate
            isDragging = true;
        } else if (e.button === 2) { // Right click - pan
            isPanning = true;
            e.preventDefault();
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        if (isDragging) {
            rotationY += deltaX * 0.01;
            rotationX += deltaY * 0.01;
        } else if (isPanning) {
            panX += deltaX * 0.01;
            panY -= deltaY * 0.01;
        }
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        isPanning = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        isPanning = false;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoom += e.deltaY * 0.01;
        zoom = Math.max(1, Math.min(20, zoom));
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function animate(part) {
    if (!gl || !program) return;
    
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Create matrices
    const modelViewMatrix = mat4Create();
    mat4Translate(modelViewMatrix, [panX, panY, -zoom]);
    mat4RotateX(modelViewMatrix, rotationX);
    mat4RotateY(modelViewMatrix, rotationY);
    
    const projectionMatrix = mat4Perspective(45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    
    // Set uniforms
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, projectionMatrix);
    gl.uniform3f(gl.getUniformLocation(program, 'color'), 116/255, 185/255, 1.0);
    
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
    if (document.getElementById('partModal').style.display === 'block') {
        requestAnimationFrame(() => animate(part));
    }
}

// Simple matrix functions
function mat4Create() { return new Float32Array(16).fill(0); }
function mat4Identity(out) { out[0]=out[5]=out[10]=out[15]=1; return out; }
function mat4Perspective(fovy, aspect, near, far) {
    const out = mat4Create(); const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) / (near - far); out[11] = -1;
    out[14] = (2 * far * near) / (near - far); return out;
}
function mat4Translate(out, v) { mat4Identity(out); out[12] = v[0]; out[13] = v[1]; out[14] = v[2]; }
function mat4RotateX(out, rad) { const s = Math.sin(rad), c = Math.cos(rad); const a01 = out[1], a02 = out[2]; out[1] = a01 * c + out[9] * s; out[2] = a02 * c + out[10] * s; out[9] = out[9] * c - a01 * s; out[10] = out[10] * c - a02 * s; }
function mat4RotateY(out, rad) { const s = Math.sin(rad), c = Math.cos(rad); const a00 = out[0], a02 = out[2]; out[0] = a00 * c - out[8] * s; out[2] = a02 * c - out[10] * s; out[8] = out[8] * c + a00 * s; out[10] = out[10] * c + a02 * s; }

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