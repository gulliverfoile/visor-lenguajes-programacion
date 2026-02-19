// ============================================
// core.js - Núcleo del analizador (Fase 1)
// 
// Este archivo contiene la lógica principal.
// Los comentarios con "// FASE X:" indican dónde
// añadir código en futuras versiones.
// ============================================

import * as jsModule from './modules/javascript.js';
import { FolderReader } from './modules/folder-reader.js';  
import { KeyboardShortcuts } from './modules/keyboard-shortcuts.js';

// ---------- Elementos del DOM ----------
const languageSelect = document.getElementById('languageSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const autoFixBtn = document.getElementById('autoFixBtn');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const problemsList = document.getElementById('problems-list');
const statsDiv = document.getElementById('stats');

let editor;                       // Instancia de CodeMirror
let reglasCargadas = null;        // Reglas actuales (se cargan al inicio)
let problemasActuales = [];        // Último análisis (para correcciones)

// ---------- Inicialización ----------
window.onload = async () => {
    // Crear editor CodeMirror
    editor = CodeMirror.fromTextArea(document.getElementById('codeInput'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'dracula',
        autoCloseBrackets: true,
        indentUnit: 2,
        tabSize: 2
    });

    // Cargar reglas iniciales
    await cargarReglas();

    // Eventos de la interfaz (Fase 1)
    analyzeBtn.addEventListener('click', analizar);
    autoFixBtn.addEventListener('click', autoFix);
    clearBtn.addEventListener('click', limpiarTodo);
    searchBtn.addEventListener('click', buscarEnCodigo);
    languageSelect.addEventListener('change', cambiarLenguaje);
    
    const folderReader = new FolderReader(editor, (code) => {  
    const ast = jsModule.parse(code);
    return jsModule.analyze(ast, reglasCargadas);
    });
    
    // Atajos de teclado (Fase 1)
    import('./modules/fixers.js').then(({ applyFix }) => {
    const keyboardShortcuts = new KeyboardShortcuts(
        editor,
        () => problemasActuales,
        (problem) => {
            const newCode = applyFix(problem, editor.getValue());
            if (newCode) {
                editor.setValue(newCode);
                analizar(); // <-- así, sin paréntesis de más
            } else {
                alert('No se pudo aplicar la corrección (quizás ya estaba corregida o no es automática).');
            }
        }
    );
});


    // FASE 2: Inicializar tutorial si existe
    // if (document.getElementById('tutorial-container')) { ... }

    // FASE 3: Inicializar modo lento
    // ...

    // FASE 4: Botón para importar reglas
    // ...

    // FASE 5: Botón para seleccionar carpeta
    // ...
};

// ---------- Cargar reglas desde YAML ----------
async function cargarReglas() {
    try {
        const response = await fetch('./rules/javascript.yaml');
        const yamlText = await response.text();
        reglasCargadas = jsyaml.load(yamlText);
        console.log('✅ Reglas cargadas:', reglasCargadas.length);
    } catch (e) {
        console.error('Error al cargar reglas:', e);
        reglasCargadas = [];
    }
}

// ---------- Análisis principal ----------
async function analizar() {
    const code = editor.getValue();
    if (!code.trim()) {
        mostrarProblemas([{ ruleName: 'Sin código', message: 'No hay código para analizar.', severity: 'baja' }]);
        return;
    }

    try {
        // Parsear código a AST
        const ast = jsModule.parse(code);

        // Aplicar reglas sintácticas
        problemasActuales = jsModule.analyze(ast, reglasCargadas);

        // FASE 2: Añadir análisis semántico
        // const semanticProblems = jsModule.analyzeSemantic(ast, code);
        // problemasActuales.push(...semanticProblems);

        // FASE 3: Modo lento - en lugar de mostrar todo, iterar con retardo
        // if (modoLentoActivo) { ... }

        mostrarProblemas(problemasActuales);
    } catch (e) {
        console.error(e);
        mostrarProblemas([{ ruleName: 'Error', message: `Error al analizar: ${e.message}`, severity: 'alta' }]);
    }
}

// ---------- Mostrar problemas en la UI ----------
function mostrarProblemas(problemas) {
    if (problemas.length === 0) {
        problemsList.innerHTML = `<div class="problem-item" style="border-left-color: #2ecc71;">✅ ¡No se encontraron problemas!</div>`;
        statsDiv.innerText = '0 problemas';
        return;
    }

    const html = problemas.map(p => `
        <div class="problem-item severity-${p.severity}" data-line="${p.line}" title="${p.message}">
            <strong>${p.ruleName}</strong> <span style="color:#888;">[línea ${p.line}]</span>
            <p>${p.message}</p>
            <button class="goto-btn" data-line="${p.line}">🔍 Ir a línea</button>
            ${p.fix ? `<button class="fix-btn" data-rule="${p.rule}" data-line="${p.line}">🔧 Corregir</button>` : ''}
        </div>
    `).join('');

    problemsList.innerHTML = html;
    statsDiv.innerText = `${problemas.length} problema(s) detectado(s)`;

    // Eventos de navegación
    document.querySelectorAll('.goto-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            irALinea(parseInt(e.target.dataset.line));
        });
    });

    // Eventos de corrección (Fase 1: solo placeholder)
    document.querySelectorAll('.fix-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // FASE 1: Solo informamos. En Fase 3 implementaremos correcciones reales.
            alert('Correcciones automáticas completas en Fase 3.');
        });
    });

    // Hacer clic en el contenedor también navega
    document.querySelectorAll('.problem-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const line = parseInt(item.dataset.line);
            irALinea(line);
        });
    });

    // FASE 2: Añadir menú contextual
    // document.querySelectorAll('.problem-item').forEach(item => {
    //     item.addEventListener('contextmenu', (e) => { ... });
    // });
}

// ---------- Navegación a línea ----------
function irALinea(line) {
    editor.setCursor({ line: line - 1, ch: 0 });
    editor.focus();
    editor.addLineClass(line - 1, 'background', 'cm-active-line');
    setTimeout(() => editor.removeLineClass(line - 1, 'background', 'cm-active-line'), 500);
}

// ---------- Corrección automática simple (Fase 1) ----------
function autoFix() {
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
        mostrarProblemas([{ ruleName: 'Corrección automática', message: `Se cambiaron ${cambios} 'var' por 'let'.`, severity: 'baja' }]);
    } else {
        mostrarProblemas([{ ruleName: 'Sin cambios', message: 'No se encontraron "var" para corregir.', severity: 'baja' }]);
    }
}

// ---------- Buscador de texto ----------
function buscarEnCodigo() {
    const query = searchInput.value.trim();
    if (!query) {
        searchResults.innerHTML = '<div style="color:#888;">Introduce un término de búsqueda.</div>';
        return;
    }

    const code = editor.getValue();
    const lines = code.split('\n');
    const results = [];

    lines.forEach((line, idx) => {
        if (line.includes(query)) {
            results.push({ line: idx + 1, text: line.trim() });
        }
    });

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
            irALinea(line);
        });
    });
}

// ---------- Cambiar lenguaje (preparado para Fase 7) ----------
function cambiarLenguaje(e) {
    const lang = e.target.value;
    if (lang === 'javascript') {
        editor.setOption('mode', 'javascript');
        // FASE 7: cargar módulo correspondiente
    }
    // else if (lang === 'python') { ... }
}

// ---------- Limpiar editor y resultados ----------
function limpiarTodo() {
    editor.setValue('');
    problemsList.innerHTML = `<div class="problem-item" style="border-left-color: #888;"><em>Ejecuta el análisis para ver los problemas.</em></div>`;
    statsDiv.innerText = '';
    searchResults.innerHTML = '';
}

// ============================================
// EXPORTACIONES PARA FASES FUTURAS
// ============================================
// FASE 2: export function mostrarTutorial() { ... }
// FASE 3: export function activarModoLento() { ... }
// FASE 4: export function importarReglas() { ... }
// FASE 5: export function seleccionarCarpeta() { ... }
// FASE 6: export function validarYAML() { ... }