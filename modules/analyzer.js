// modules/analyzer.js
// Lógica de análisis: cargar reglas, analizar con AST, aplicar correcciones y transformaciones.

import * as jsModule from './javascript.js';
import { applyFix as applyFixFromModule } from './fixers.js';

let currentRules = [];

/**
 * Carga las reglas desde un archivo YAML.
 * @param {string} url - Ruta al archivo YAML.
 */
export async function loadRules(url) {
    try {
        const response = await fetch(url);
        const yamlText = await response.text();
        currentRules = jsyaml.load(yamlText);
        console.log(`✅ Reglas cargadas: ${currentRules.length}`);
    } catch (e) {
        console.error('Error al cargar reglas:', e);
        currentRules = [];
    }
    return currentRules;
}

/**
 * Analiza el código y devuelve la lista de problemas.
 * @param {string} code - Código fuente.
 * @returns {Array} Problemas detectados.
 */
export function analyzeCode(code) {
    if (!code.trim()) {
        return [{
            ruleName: 'Sin código',
            message: 'No hay código para analizar.',
            severity: 'baja'
        }];
    }

    try {
        const ast = jsModule.parse(code);
        const problems = jsModule.analyze(ast, currentRules);
        return problems;
    } catch (e) {
        console.error(e);
        return [{
            ruleName: 'Error',
            message: `Error al analizar: ${e.message}`,
            severity: 'alta'
        }];
    }
}

/**
 * Aplica una corrección a un problema específico.
 * @param {Object} problem - El problema a corregir.
 * @param {string} code - Código actual.
 * @returns {string|null} Código corregido o null si no se pudo.
 */
export function applyFix(problem, code) {
    return applyFixFromModule(problem, code);
}

/**
 * Carga las transformaciones desde un archivo YAML.
 * @param {string} url - Ruta al archivo YAML.
 */
export async function loadTransformaciones(url) {
    try {
        const response = await fetch(url);
        const yamlText = await response.text();
        return jsyaml.load(yamlText);
    } catch (e) {
        console.error('Error al cargar transformaciones:', e);
        return [];
    }
}

/**
 * Aplica una transformación al código.
 * @param {string} code - Código original.
 * @param {Object} transformacion - Objeto con { nombre, busca, reemplaza }.
 * @returns {string|null} Código transformado o null si no hubo cambios.
 */
export function aplicarTransformacion(code, transformacion) {
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    const nodos = esquery(ast, transformacion.busca);
    
    if (nodos.length === 0) return null;

    // Modificamos de atrás hacia adelante para no alterar las posiciones
    let nuevoCodigo = code;
    nodos.sort((a, b) => b.start - a.start).forEach(nodo => {
        const textoOriginal = code.slice(nodo.start, nodo.end);
        let textoReemplazo = transformacion.reemplaza;
        
        // Si el reemplazo contiene $&, lo sustituimos por el texto original
        if (textoReemplazo.includes('$&')) {
            textoReemplazo = textoReemplazo.replace(/\$&/g, textoOriginal);
        }
        
        nuevoCodigo = nuevoCodigo.slice(0, nodo.start) + textoReemplazo + nuevoCodigo.slice(nodo.end);
    });
    
    return nuevoCodigo;
}