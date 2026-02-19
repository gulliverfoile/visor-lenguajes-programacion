// ============================================
// modules/javascript.js - Módulo de análisis para JavaScript
// 
// Fase 1: Análisis sintáctico básico con reglas YAML.
// Fase 2: Añadiremos análisis semántico.
// Fase 3: Preparado para modo lento.
// ============================================

// ---------- Parsear código a AST ----------
export function parse(code) {
    return acorn.parse(code, {
        ecmaVersion: 2020,
        locations: true,
        sourceType: 'module'
    });
}

// ---------- Análisis sintáctico con reglas ----------
export function analyze(ast, rules) {
    const problems = [];

    rules.forEach(rule => {
        // Si la regla no tiene patrón AST, la ignoramos (podría ser semántica)
        if (!rule.patron_ast) return;

        // Usar esquery para encontrar nodos que coincidan
        const matches = esquery(ast, rule.patron_ast);

        matches.forEach(node => {
            problems.push({
                rule: rule.id,
                ruleName: rule.nombre,
                severity: rule.severidad,
                message: rule.descripcion,
                line: node.loc.start.line,
                column: node.loc.start.column,
                fix: !!rule.transform  // Indica si hay corrección asociada (Fase 3)
            });
        });
    });

    return problems;
}

// ---------- Análisis semántico (Fase 2) ----------
// export function analyzeSemantic(ast, code) {
//     const problems = [];
//     // Detectar variables no usadas, funciones sin return, etc.
//     return problems;
// }

// ---------- Funciones auxiliares para modo lento (Fase 3) ----------
// export function* analyzeSlow(ast, rules) {
//     // Generador que va produciendo resultados paso a paso
// }