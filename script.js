/**
 * Schema Designer - Logic
 * Premium Version with Multi-dialect Support
 */

const DIALECTS = {
    SQL_SERVER: 'SQL Server',
    POSTGRESQL: 'PostgreSQL',
    MYSQL: 'MySQL',
    SQLITE: 'SQLite'
};

const TYPES = ['INT', 'BIGINT', 'SMALLINT', 'VARCHAR', 'TEXT', 'CHAR', 'DATE', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'DOUBLE', 'UUID', 'JSON', 'ARRAY', 'BLOB', 'ENUM'];

// App State
let state = {
    tableName: 'my_table',
    columns: [],
    dialect: DIALECTS.SQL_SERVER,
    theme: 'light',
    includeSqlInPdf: true,
    colVis: {
        pkfk: true,
        name: true,
        type: true,
        details: true,
        nn: true
    }
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initDefaultColumns();
    setupEventListeners();
    document.documentElement.setAttribute('data-theme', state.theme);
    render();
});

function initDefaultColumns() {
    state.columns = [
        { id: crypto.randomUUID(), name: 'id', type: 'INT', pk: true, nn: true, fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
        { id: crypto.randomUUID(), name: 'created_at', type: 'TIMESTAMP', pk: false, nn: true, fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true }
    ];
}

// --- Rendering ---

function render() {
    renderTable();
    renderSQL();
    renderVisualizer();
    updateStats();
    renderVisibilityControls();
}

function renderVisibilityControls() {
    const container = document.getElementById('visControls');
    if (!container) return;
    
    container.innerHTML = `
        <label class="vis-pill">
            <input type="checkbox" ${state.colVis.pkfk ? 'checked' : ''} onchange="toggleColVis('pkfk', this.checked)"> PK/FK
        </label>
        <label class="vis-pill">
            <input type="checkbox" ${state.colVis.name ? 'checked' : ''} onchange="toggleColVis('name', this.checked)"> Name
        </label>
        <label class="vis-pill">
            <input type="checkbox" ${state.colVis.type ? 'checked' : ''} onchange="toggleColVis('type', this.checked)"> Type
        </label>
        <label class="vis-pill">
            <input type="checkbox" ${state.colVis.details ? 'checked' : ''} onchange="toggleColVis('details', this.checked)"> Details
        </label>
        <label class="vis-pill">
            <input type="checkbox" ${state.colVis.nn ? 'checked' : ''} onchange="toggleColVis('nn', this.checked)"> Not Null
        </label>
        <div style="width: 1px; background: var(--border); margin: 0 0.5rem;"></div>
        <label class="vis-pill">
            <input type="checkbox" ${state.includeSqlInPdf ? 'checked' : ''} onchange="toggleSqlPdf(this.checked)"> Include SQL in PDF
        </label>
    `;
}

function toggleColVis(col, val) {
    state.colVis[col] = val;
    const th = document.getElementById(`th-${col}`);
    if (th) {
        if (val) th.classList.remove('col-hidden', 'no-print');
        else th.classList.add('col-hidden', 'no-print');
    }
    render();
}

function toggleSqlPdf(val) {
    state.includeSqlInPdf = val;
    const container = document.getElementById('sqlSection');
    if (val) container.classList.remove('no-print');
    else container.classList.add('no-print');
}

function renderTable() {
    const tbody = document.getElementById('schemaBody');
    tbody.innerHTML = '';

    state.columns.forEach((col, index) => {
        const tr = document.createElement('tr');
        tr.className = `animate-in ${!col.visible ? 'row-hidden print-exclude' : ''}`;
        if (!col.visible) tr.classList.add('no-print');
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.setAttribute('draggable', 'true');
        tr.dataset.id = col.id;
        
        tr.innerHTML = `
            <td class="drag-handle no-print">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px;"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </td>
            <td class="${!state.colVis.pkfk ? 'col-hidden no-print' : ''}">
                <div class="toggle-pill ${col.pk ? 'active-pk' : ''}" onclick="togglePK('${col.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
                    PK
                </div>
                <div class="toggle-pill ${col.fk.enabled ? 'active-fk' : ''}" onclick="toggleFK('${col.id}')" style="margin-top: 4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    FK
                </div>
                ${col.fk.enabled ? `
                    <div class="fk-ref-inputs no-print" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                        <input class="fk-input" placeholder="Ref Table" value="${col.fk.table}" oninput="updateFK('${col.id}', 'table', this.value)">
                        <input class="fk-input" placeholder="Ref Col" value="${col.fk.col}" oninput="updateFK('${col.id}', 'col', this.value)">
                    </div>
                    <div class="fk-ref-print print-only" style="font-size: 0.65rem; color: #0d9488; margin-top: 2px;">
                        → ${col.fk.table || '?'}.${col.fk.col || '?'}
                    </div>
                ` : ''}
            </td>
            <td class="${!state.colVis.name ? 'col-hidden no-print' : ''}">
                <input class="col-input" value="${col.name}" placeholder="column_name" oninput="updateColumn('${col.id}', 'name', this.value)">
            </td>
            <td class="${!state.colVis.type ? 'col-hidden no-print' : ''}">
                <select class="type-select" onchange="updateColumn('${col.id}', 'type', this.value)">
                    ${TYPES.map(t => `<option value="${t}" ${col.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </td>
            <td class="${!state.colVis.details ? 'col-hidden no-print' : ''}">
                ${['ENUM', 'JSON', 'ARRAY'].includes(col.type) ? `
                    <input class="col-input" 
                           placeholder="${col.type === 'ENUM' ? 'val1, val2...' : (col.type === 'JSON' ? '{...}' : '[...]')}" 
                           value="${col.enumVals ? col.enumVals.join(', ') : ''}" 
                           oninput="updateEnumVals('${col.id}', this.value)">
                ` : '<span style="opacity: 0.3; font-size: 0.7rem;">N/A</span>'}
            </td>
            <td style="text-align: center;" class="${!state.colVis.nn ? 'col-hidden no-print' : ''}">
                <input type="checkbox" ${col.nn ? 'checked' : ''} onchange="updateColumn('${col.id}', 'nn', this.checked)">
            </td>
            <td class="eye-col">
                <div style="display: flex; gap: 4px; justify-content: flex-end;">
                    <button class="btn" title="Toggle PDF visibility" onclick="toggleRowVis('${col.id}')" style="padding: 4px 8px;">
                        ${col.visible ? '👁️' : '🙈'}
                    </button>
                    <button class="btn btn-danger" onclick="removeColumn('${col.id}')" style="padding: 4px 8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    setupDragAndDrop();
}

let dragSrcId = null;

function setupDragAndDrop() {
    const rows = document.querySelectorAll('#schemaBody tr');
    rows.forEach(row => {
        row.addEventListener('dragstart', (e) => {
            dragSrcId = row.dataset.id;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            row.classList.add('drag-over');
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('drag-over');
            const targetId = row.dataset.id;
            if (dragSrcId !== targetId) {
                const srcIndex = state.columns.findIndex(c => c.id === dragSrcId);
                const targetIndex = state.columns.findIndex(c => c.id === targetId);
                const [moved] = state.columns.splice(srcIndex, 1);
                state.columns.splice(targetIndex, 0, moved);
                render();
            }
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
        });
    });
}

function highlightSQL(sql) {
    const kws = ['CREATE', 'TABLE', 'PRIMARY', 'KEY', 'IDENTITY', 'NOT', 'NULL', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'AUTO_INCREMENT'];
    
    // We'll use a temporary array to store highlighted spans to avoid re-matching
    let tokens = [];
    let html = sql;

    // 1. Strings/Literals
    html = html.replace(/'([^']*)'/g, (m) => {
        tokens.push(`<span class="sql-val">${m}</span>`);
        return `__TOKEN_${tokens.length - 1}__`;
    });

    // 2. Quoted identifiers
    const identifierRegex = /(\[([^\]]+)\])|(`([^`]+)`)|("([^"]+)")/g;
    html = html.replace(identifierRegex, (m) => {
        tokens.push(`<span class="sql-col">${m}</span>`);
        return `__TOKEN_${tokens.length - 1}__`;
    });
    
    // 3. Keywords (only match whole words)
    kws.forEach(kw => {
        const reg = new RegExp(`\\b${kw}\\b`, 'g');
        html = html.replace(reg, (m) => {
            tokens.push(`<span class="sql-kw">${m}</span>`);
            return `__TOKEN_${tokens.length - 1}__`;
        });
    });
    
    // 4. Types
    const sortedTypes = [...TYPES].sort((a, b) => b.length - a.length);
    sortedTypes.forEach(t => {
        const reg = new RegExp(`\\b${t}\\b`, 'g');
        html = html.replace(reg, (m) => {
            tokens.push(`<span class="sql-type">${m}</span>`);
            return `__TOKEN_${tokens.length - 1}__`;
        });
    });

    // Final pass: restore tokens
    tokens.forEach((t, i) => {
        html = html.replace(`__TOKEN_${i}__`, t);
    });
    
    return html;
}

function renderSQL() {
    const sqlBox = document.getElementById('sqlBox');
    const tName = state.tableName || 'my_table';
    let sql = '';

    const quotes = state.dialect === DIALECTS.SQL_SERVER ? ['[', ']'] : 
                 state.dialect === DIALECTS.MYSQL ? ['`', '`'] : ['"', '"'];

    const q = (str) => `${quotes[0]}${str}${quotes[1]}`;

    if (state.dialect === DIALECTS.SQL_SERVER) {
        sql = `CREATE TABLE ${q(tName)} (\n`;
        const colLines = state.columns.map(c => {
            let line = `  ${q(c.name)} ${c.type}`;
            // ENUM in SQL Server: use a CHECK constraint
            if (c.type === 'ENUM' && c.enumVals && c.enumVals.length > 0) {
                line = `  ${q(c.name)} NVARCHAR(50) CHECK (${q(c.name)} IN (${c.enumVals.map(v => `'${v.trim()}'`).join(', ')}))`;
            }
            if (c.pk) line += ' PRIMARY KEY IDENTITY(1,1)';
            else if (c.nn) line += ' NOT NULL';
            return line;
        });
        
        const fkLines = state.columns
            .filter(c => c.fk.enabled && c.fk.table && c.fk.col)
            .map(c => `  CONSTRAINT FK_${tName}_${c.name} FOREIGN KEY (${q(c.name)}) REFERENCES ${q(c.fk.table)}(${q(c.fk.col)})`);
        
        sql += [...colLines, ...fkLines].join(',\n');
        sql += `\n);`;
    } else if (state.dialect === DIALECTS.POSTGRESQL) {
        sql = `CREATE TABLE ${q(tName)} (\n`;
        const colLines = state.columns.map(c => {
            let type = c.type;
            if (c.pk && type === 'INT') type = 'SERIAL';
            if (type === 'ENUM' && c.enumVals && c.enumVals.length > 0) {
                // In PG, usually need a separate TYPE, but for simplicity we'll show it as a comment or similar
                // Or just use the native ENUM syntax if it was defined
                type = `VARCHAR CHECK (${q(c.name)} IN (${c.enumVals.map(v => `'${v.trim()}'`).join(', ')}))`;
            }
            let line = `  ${q(c.name)} ${type}`;
            if (c.pk) line += ' PRIMARY KEY';
            else if (c.nn) line += ' NOT NULL';
            return line;
        });
        
        const fkLines = state.columns
            .filter(c => c.fk.enabled && c.fk.table && c.fk.col)
            .map(c => `  FOREIGN KEY (${q(c.name)}) REFERENCES ${q(c.fk.table)}(${q(c.fk.col)})`);
        
        sql += [...colLines, ...fkLines].join(',\n');
        sql += `\n);`;
    } else if (state.dialect === DIALECTS.MYSQL) {
        sql = `CREATE TABLE ${q(tName)} (\n`;
        const colLines = state.columns.map(c => {
            let type = c.type;
            if (type === 'ENUM' && c.enumVals && c.enumVals.length > 0) {
                type = `ENUM(${c.enumVals.map(v => `'${v.trim()}'`).join(', ')})`;
            }
            let line = `  ${q(c.name)} ${type}`;
            if (c.pk) line += ' PRIMARY KEY AUTO_INCREMENT';
            else if (c.nn) line += ' NOT NULL';
            return line;
        });
        sql += colLines.join(',\n');
        sql += `\n);`;
    } else {
        // Simple default for others
        sql = `CREATE TABLE ${tName} (\n`;
        sql += state.columns.map(c => {
            let type = c.type;
            if (type === 'ENUM' && c.enumVals && c.enumVals.length > 0) {
                type = `ENUM(${c.enumVals.map(v => `'${v.trim()}'`).join(', ')})`;
            }
            return `  ${c.name} ${type}${c.pk ? ' PRIMARY KEY' : (c.nn ? ' NOT NULL' : '')}`;
        }).join(',\n');
        sql += `\n);`;
    }

    sqlBox.innerHTML = highlightSQL(sql);
}

function renderVisualizer() {
    const container = document.getElementById('visualizer');
    const tName = state.tableName || 'table_name';
    const visibleCols = state.columns.filter(c => c.visible);
    
    container.innerHTML = `
        <div class="table-node animate-in">
            <div class="table-node-header">${tName}</div>
            <div class="table-node-body">
                ${visibleCols.map(c => `
                    <div class="node-col">
                        <span style="color: ${c.pk ? 'var(--amber)' : (c.fk.enabled ? 'var(--teal)' : 'inherit')}">
                            ${c.pk ? '🔑 ' : (c.fk.enabled ? '🔗 ' : '')}${c.name || '...'}
                        </span>
                        <span style="opacity: 0.5">${c.type}</span>
                    </div>
                `).join('')}
                ${visibleCols.length === 0 ? '<div style="opacity:0.4; font-size:0.75rem; text-align:center; padding: 0.5rem;">No visible columns</div>' : ''}
            </div>
        </div>
    `;
}

function updateStats() {
    document.getElementById('colCount').textContent = `${state.columns.length} columns`;
}

// --- Actions ---

function addColumn() {
    const id = crypto.randomUUID();
    state.columns.push({
        id: id,
        name: '',
        type: 'VARCHAR',
        pk: false,
        nn: false,
        fk: { enabled: false, table: '', col: '' },
        enumVals: [],
        visible: true
    });
    render();
    setTimeout(() => {
        const inputs = document.querySelectorAll('.col-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput) lastInput.focus();
    }, 50);
}

function toggleRowVis(id) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col.visible = !col.visible;
        render();
    }
}

function removeColumn(id) {
    state.columns = state.columns.filter(c => c.id !== id);
    render();
}

function updateColumn(id, field, value) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col[field] = value;
        // If the type changed, re-render the whole table so the Details cell updates
        if (field === 'type') {
            render();
        } else {
            renderSQL();
            renderVisualizer();
        }
    }
}

function togglePK(id) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col.pk = !col.pk;
        if (col.pk) col.nn = true;
        render();
    }
}

function toggleFK(id) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col.fk.enabled = !col.fk.enabled;
        render();
    }
}

function updateFK(id, field, value) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col.fk[field] = value;
        renderSQL();
        renderVisualizer();
    }
}

function updateEnumVals(id, value) {
    const col = state.columns.find(c => c.id === id);
    if (col) {
        col.enumVals = value.split(',').map(v => v.trim()).filter(v => v);
        renderSQL();
    }
}

function changeDialect(val) {
    state.dialect = val;
    renderSQL();
}

function copySQL() {
    const sql = document.getElementById('sqlBox').textContent;
    navigator.clipboard.writeText(sql).then(() => {
        showToast('SQL copied to clipboard!');
    });
}

function downloadSQL() {
    const sql = document.getElementById('sqlBox').textContent;
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableName || 'schema'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);  // Prevent memory leak
    showToast('SQL file downloaded');
}

function saveJSON() {
    const data = {
        tableName: state.tableName,
        columns: state.columns,
        dialect: state.dialect,
        theme: state.theme
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableName || 'schema'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);  // Prevent memory leak
    showToast('JSON saved successfully');
}

function loadJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            state.tableName = data.tableName || 'my_table';
            state.columns = (data.columns || []).map(c => ({
                ...c,
                visible: c.visible !== false,           // default visible
                fk: c.fk || { enabled: false, table: '', col: '' },
                enumVals: c.enumVals || []
            }));
            state.dialect = data.dialect || DIALECTS.SQL_SERVER;
            state.theme = data.theme || 'light';  // default light, not dark
            
            document.getElementById('tableName').value = state.tableName;
            document.getElementById('dialectSelect').value = state.dialect;
            document.documentElement.setAttribute('data-theme', state.theme);
            
            render();
            showToast('Schema loaded successfully');
        } catch (err) {
            showToast('Error loading JSON');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function exportPDF() {
    window.print();
}

function clearAll() {
    if (confirm('Are you sure you want to delete all columns?')) {
        state.columns = [];
        render();
        showToast('Cleared all columns');
    }
}

function addTemplate(type) {
    const templates = {
        users: [
            { id: crypto.randomUUID(), name: 'id',            type: 'INT',       pk: true,  nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'username',      type: 'VARCHAR',   pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'email',         type: 'VARCHAR',   pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'password_hash', type: 'VARCHAR',   pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'created_at',    type: 'TIMESTAMP', pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true }
        ],
        products: [
            { id: crypto.randomUUID(), name: 'id',             type: 'INT',     pk: true,  nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'sku',            type: 'VARCHAR', pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'name',           type: 'VARCHAR', pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'price',          type: 'DECIMAL', pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'stock_quantity', type: 'INT',     pk: false, nn: true,  fk: { enabled: false, table: '', col: '' }, enumVals: [], visible: true }
        ],
        orders: [
            { id: crypto.randomUUID(), name: 'id',           type: 'INT',      pk: true,  nn: true,  fk: { enabled: false, table: '', col: '' },          enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'user_id',      type: 'INT',      pk: false, nn: true,  fk: { enabled: true,  table: 'users', col: 'id' },  enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'order_date',   type: 'DATETIME', pk: false, nn: true,  fk: { enabled: false, table: '', col: '' },          enumVals: [], visible: true },
            { id: crypto.randomUUID(), name: 'total_amount', type: 'DECIMAL',  pk: false, nn: true,  fk: { enabled: false, table: '', col: '' },          enumVals: [], visible: true }
        ]
    };
    
    if (templates[type]) {
        state.columns = templates[type].map(c => ({ ...c, visible: true }));
        state.tableName = type;
        document.getElementById('tableName').value = type;
        render();
        showToast(`Loaded ${type} template`);
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
}

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; color: var(--green)"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Event Listeners ---

function setupEventListeners() {
    document.getElementById('tableName').addEventListener('input', (e) => {
        state.tableName = e.target.value;
        renderSQL();
        renderVisualizer();
    });

    document.getElementById('dialectSelect').addEventListener('change', (e) => {
        changeDialect(e.target.value);
    });

    document.getElementById('addColumnBtn').onclick = addColumn;
    document.getElementById('copySqlBtn').onclick = copySQL;
    document.getElementById('downloadSqlBtn').onclick = downloadSQL;
    document.getElementById('themeToggleBtn').onclick = toggleTheme;
    document.getElementById('saveBtn').onclick = saveJSON;
    document.getElementById('clearBtn').onclick = clearAll;
    document.getElementById('pdfBtn').onclick = exportPDF;

    const fileInput = document.getElementById('fileInput');
    document.getElementById('loadBtn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => loadJSON(e.target.files[0]);
}
