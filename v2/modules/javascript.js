// modules/javascript.js
export function parse(code) {
    return acorn.parse(code, {
        ecmaVersion: 2020,
        locations: true,
        sourceType: 'module'
    });
}

export function analyze(ast, rules) {
    const problems = [];

    rules.forEach(rule => {
        if (!rule.patron_ast) return;

        const matches = esquery(ast, rule.patron_ast);

        matches.forEach(node => {
            problems.push({
                rule: rule.id,
                ruleName: rule.nombre,
                severity: rule.severidad,
                message: rule.descripcion,
                line: node.loc.start.line,
                column: node.loc.start.column,
                fix: !!rule.transform
            });
        });
    });

    return problems;
}