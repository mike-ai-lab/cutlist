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
        const padding = 20;
        const maxCanvasDim = 400;
        const scale = Math.min(
            (maxCanvasDim - 2 * padding) / board.stock_width,
            (maxCanvasDim - 2 * padding) / board.stock_height
        );

        canvas.width = board.stock_width * scale + 2 * padding;
        canvas.height = board.stock_height * scale + 2 * padding;

        // Draw Board Outline
        ctx.fillStyle = '#e9e9e9';
        ctx.fillRect(padding, padding, board.stock_width * scale, board.stock_height * scale);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, board.stock_width * scale, board.stock_height * scale);

        // Draw Parts
        const parts = board.parts_on_board || board.parts || [];
        parts.forEach((part, partIndex) => {
            const partX = padding + part.x * scale;
            const partY = padding + part.y * scale;
            const partWidth = part.width * scale;
            const partHeight = part.height * scale;

            ctx.fillStyle = getPartColor(partIndex);
            ctx.fillRect(partX, partY, partWidth, partHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(partX, partY, partWidth, partHeight);

            // Add part label
            ctx.fillStyle = '#000';
            ctx.font = `${Math.max(8, 10 * scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelContent = `P${partIndex + 1}`;
            ctx.fillText(labelContent, partX + partWidth / 2, partY + partHeight / 2);
        });
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
        <tr><td>Total Parts</td><td>${g_reportData.summary.total_parts}</td></tr>
        <tr><td>Total Boards</td><td>${g_reportData.summary.total_boards}</td></tr>
        <tr><td>Overall Efficiency</td><td>${g_reportData.summary.overall_efficiency.toFixed(2)}%</td></tr>
    `;

    // Boards Table
    const boardsTable = document.getElementById('boardsTable');
    boardsTable.innerHTML = `
        <tr><th>Board#</th><th>Material</th><th>Size</th><th>Parts</th><th>Efficiency</th></tr>
    `;
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

    // Parts Table
    const partsTable = document.getElementById('partsTable');
    partsTable.innerHTML = `
        <tr><th>Part#</th><th>Name</th><th>Dimensions</th><th>Board#</th><th>Position</th></tr>
    `;
    g_reportData.parts.forEach(part => {
        partsTable.innerHTML += `
            <tr>
                <td>${part.part_number}</td>
                <td>${part.name}</td>
                <td>${part.width.toFixed(0)} × ${part.height.toFixed(0)}mm</td>
                <td>${part.board_number}</td>
                <td>(${part.position_x.toFixed(0)}, ${part.position_y.toFixed(0)})</td>
            </tr>
        `;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('printButton').addEventListener('click', () => {
        // Simple print for now
        document.title = 'AutoNestCut_Report';
        window.print();
    });

    document.getElementById('exportCsvButton').addEventListener('click', () => {
        callRuby('export_csv');
    });

    callRuby('ready');
});