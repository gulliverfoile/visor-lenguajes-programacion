// main.js
import { initEditor, setupEventHandlers, renderProblems, showSearchResults, clearAll, getEditor, getCurrentProblems, goToLine, setOnGotoLineCallback } from './modules/ui.js';
import { loadRules, analyzeCode, applyFix, loadTransformaciones, aplicarTransformacion } from './modules/analyzer.js';
import { FolderReader } from './modules/folder-reader.js';
import { KeyboardShortcuts } from './modules/keyboard-shortcuts.js';

window.onload = async () => {
    const editor = initEditor();
    const ruleCount = (await loadRules('./rules/javascript.yaml')).length;
    console.log(`📋 Reglas cargadas: ${ruleCount}`);

    setupEventHandlers({
        onAnalyze: handleAnalyze,
        onAutoFix: handleAutoFix,
        onClear: handleClear,
        onSearch: handleSearch,
        onLanguageChange: handleLanguageChange,
        onApplyFix: handleApplyFix,
        onRemoveLogs: handleRemoveLogs,
        onApplyTransform: handleApplyTransform
    });

    // FolderReader y atajos de teclado (opcional)
    const folderReader = new FolderReader(editor, (code) => analyzeCode(code));
    setOnGotoLineCallback((line) => {});

    new KeyboardShortcuts(
        editor,
        () => getCurrentProblems(),
        (problem) => handleApplyFix(problem)
    );

    editor.setValue(`function ejemplo() {
  var x = 1;
  console.log(x);
  var x = 2; // repetida
  return x;
}`);
};

// Handlers
async function handleAnalyze() {
    const code = getEditor().getValue();
    const problems = analyzeCode(code);
    renderProblems(problems);
}

function handleAutoFix() {
    const editor = getEditor();
    let code = editor.getValue();
    const lines = code.split('\n');
    let cambios = 0;

    const newLines = lines.map(line => {
        if (line.includes('var ') && !line.includes('let ') && !line.includes('const ')) {
            cambios++;
            return line.replace(/\bvar\b/g, 'let');
        }
        return line;
    });

    if (cambios > 0) {
        editor.setValue(newLines.join('\n'));
        renderProblems([{
            ruleName: 'Corrección automática',
            message: `Se cambiaron ${cambios} 'var' por 'let'.`,
            severity: 'baja'
        }]);
    } else {
        renderProblems([{
            ruleName: 'Sin cambios',
            message: 'No se encontraron "var" para corregir.',
            severity: 'baja'
        }]);
    }
}

function handleClear() {
    clearAll();
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        showSearchResults([]);
        return;
    }

    const code = getEditor().getValue();
    const lines = code.split('\n');
    const results = [];

    lines.forEach((line, idx) => {
        if (line.includes(query)) {
            results.push({ line: idx + 1, text: line.trim() });
        }
    });

    showSearchResults(results);
}

function handleLanguageChange(e) {
    const lang = e.target.value;
    const editor = getEditor();
    if (lang === 'javascript') {
        editor.setOption('mode', 'javascript');
    }
}

function handleApplyFix(problem) {
    const editor = getEditor();
    const currentCode = editor.getValue();
    const newCode = applyFix(problem, currentCode);
    if (newCode) {
        editor.setValue(newCode);
        handleAnalyze();
    } else {
        alert('No se pudo aplicar la corrección.');
    }
}

async function handleRemoveLogs() {
    const editor = getEditor();
    const code = editor.getValue();
    const problems = analyzeCode(code);
    const logProblems = problems.filter(p => p.rule === 'console-log');
    
    if (logProblems.length === 0) {
        alert('No hay console.log para eliminar.');
        return;
    }

    let newCode = code;
    logProblems.sort((a, b) => b.line - a.line).forEach(problem => {
        const fixed = applyFix(problem, newCode);
        if (fixed) newCode = fixed;
    });

    editor.setValue(newCode);
    handleAnalyze();
}

async function handleApplyTransform() {
    const editor = getEditor();
    const code = editor.getValue();
    
    const transformaciones = await loadTransformaciones('./transformaciones.yaml');
    
    let nuevoCodigo = code;
    transformaciones.forEach(trans => {
        const resultado = aplicarTransformacion(nuevoCodigo, trans);
        if (resultado) nuevoCodigo = resultado;
    });
    
    if (nuevoCodigo !== code) {
        editor.setValue(nuevoCodigo);
        handleAnalyze();
    } else {
        alert('No se aplicó ninguna transformación.');
    }
}