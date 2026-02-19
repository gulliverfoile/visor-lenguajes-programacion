// modules/fixers.js
export const fixers = {
    'no-var': (code, line) => {
        const lines = code.split('\n');
        const lineIndex = line - 1;
        const original = lines[lineIndex];
        const fixed = original.replace(/\bvar\b(?![\w])/g, 'let');
        if (original === fixed) return null;
        lines[lineIndex] = fixed;
        return lines.join('\n');
    },

    'console-log': (code, line) => {
        const lines = code.split('\n');
        const lineIndex = line - 1;
        const original = lines[lineIndex];
        if (original.trim().startsWith('//')) return null;
        lines[lineIndex] = '// ' + original;
        return lines.join('\n');
    },

    'eqeqeq': (code, line) => {
        const lines = code.split('\n');
        const lineIndex = line - 1;
        const original = lines[lineIndex];
        const fixed = original.replace(/==(?!=)/g, '===');
        if (original === fixed) return null;
        lines[lineIndex] = fixed;
        return lines.join('\n');
    },

    'no-empty-function': (code, line) => {
        const lines = code.split('\n');
        const lineIndex = line - 1;
        const original = lines[lineIndex];
        if (original.includes('// TODO')) return null;
        lines[lineIndex] = original + ' // TODO: implementar función';
        return lines.join('\n');
    },
};

export function applyFix(problem, currentCode) {
    const fixer = fixers[problem.rule];
    if (!fixer) {
        console.warn(`No hay fixer para la regla ${problem.rule}`);
        return null;
    }
    return fixer(currentCode, problem.line);
}