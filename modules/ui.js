// modules/ui.js
// Manejo de la interfaz de usuario: editor, listado de problemas, búsqueda, navegación.

// Elementos del DOM
const languageSelect = document.getElementById('languageSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const autoFixBtn = document.getElementById('autoFixBtn');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const problemsList = document.getElementById('problems-list');
const statsDiv = document.getElementById('stats');

let editor;
let currentProblems = [];
let onGotoLineCallback = null;

/**
 * Inicializa el editor CodeMirror con plegado y línea guía.
 */
export function initEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('codeInput'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'dracula',
        autoCloseBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        // Plegado
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        // Línea guía a los 80 caracteres
        rulers: [{ column: 80, color: "#ff6666" }]
    });
    return editor;
}

/**
 * Configura los event listeners de la interfaz.
 */
export function setupEventHandlers({ onAnalyze, onAutoFix, onClear, onSearch, onLanguageChange, onApplyFix, onRemoveLogs, onApplyTransform }) {
    analyzeBtn.addEventListener('click', onAnalyze);
    autoFixBtn.addEventListener('click', onAutoFix);
    clearBtn.addEventListener('click', onClear);
    searchBtn.addEventListener('click', onSearch);
    languageSelect.addEventListener('change', onLanguageChange);
    document.getElementById('removeLogsBtn').addEventListener('click', onRemoveLogs);
    document.getElementById('applyTransformBtn').addEventListener('click', onApplyTransform);

    // Guardamos el callback de applyFix para usarlo en los botones dinámicos
    window._applyFixHandler = onApplyFix;
}

/**
 * Renderiza la lista de problemas.
 */
export function renderProblems(problems) {
    currentProblems = problems;

    if (problems.length === 0) {
        problemsList.innerHTML = `<div class="problem-item" style="border-left-color: #2ecc71;">✅ ¡No se encontraron problemas!</div>`;
        statsDiv.innerText = '0 problemas';
        return;
    }

    const html = problems.map(p => `
        <div class="problem-item severity-${p.severity}" data-line="${p.line}" title="${p.message}">
            <strong>${p.ruleName}</strong> <span style="color:#888;">[línea ${p.line}]</span>
            <p>${p.message}</p>
            <button class="goto-btn" data-line="${p.line}">🔍 Ir a línea</button>
            ${p.fix ? `<button class="fix-btn" data-rule="${p.rule}" data-line="${p.line}">🔧 Corregir</button>` : ''}
        </div>
    `).join('');

    problemsList.innerHTML = html;
    statsDiv.innerText = `${problems.length} problema(s) detectado(s)`;

    // Asignar eventos
    document.querySelectorAll('.goto-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const line = parseInt(e.target.dataset.line);
            goToLine(line);
        });
    });

    document.querySelectorAll('.fix-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rule = e.target.dataset.rule;
            const line = parseInt(e.target.dataset.line);
            const problem = problems.find(p => p.rule === rule && p.line === line);
            if (problem && window._applyFixHandler) {
                window._applyFixHandler(problem);
            } else {
                alert('No se pudo aplicar la corrección.');
            }
        });
    });

    document.querySelectorAll('.problem-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const line = parseInt(item.dataset.line);
            goToLine(line);
        });
    });
}

/**
 * Mueve el cursor a una línea y la resalta.
 */
export function goToLine(line) {
    if (!editor) return;
    editor.setCursor({ line: line - 1, ch: 0 });
    editor.focus();
    editor.addLineClass(line - 1, 'background', 'cm-active-line');
    setTimeout(() => editor.removeLineClass(line - 1, 'background', 'cm-active-line'), 500);

    if (onGotoLineCallback) {
        onGotoLineCallback(line);
    }
}

/**
 * Establece callback para cuando se navega a una línea.
 */
export function setOnGotoLineCallback(callback) {
    onGotoLineCallback = callback;
}

/**
 * Muestra resultados de búsqueda.
 */
export function showSearchResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="color:#888;">No se encontraron resultados.</div>';
        return;
    }

    const html = results.map(r => `
        <div class="search-result-item" data-line="${r.line}">
            <strong>Línea ${r.line}:</strong> ${r.text.substring(0, 50)}${r.text.length > 50 ? '…' : ''}
        </div>
    `).join('');

    searchResults.innerHTML = html;

    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const line = parseInt(item.dataset.line);
            goToLine(line);
        });
    });
}

/**
 * Limpia editor y resultados.
 */
export function clearAll() {
    editor.setValue('');
    problemsList.innerHTML = `<div class="problem-item" style="border-left-color: #888;"><em>Ejecuta el análisis para ver los problemas.</em></div>`;
    statsDiv.innerText = '';
    searchResults.innerHTML = '';
}

/**
 * Obtiene la instancia del editor.
 */
export function getEditor() {
    return editor;
}

/**
 * Obtiene la lista actual de problemas.
 */
export function getCurrentProblems() {
    return currentProblems;
}