// modules/keyboard-shortcuts.js
// (Sin cambios, lo incluyo por completitud)

export class KeyboardShortcuts {
    constructor(editor, getProblems, applyFix, options = {}) {
        this.editor = editor;
        this.getProblems = getProblems;
        this.applyFix = applyFix;
        this.options = {
            nextProblemKey: 'Ctrl+Shift+N',
            prevProblemKey: 'Ctrl+Shift+P',
            applyFixKey: 'Ctrl+Shift+F',
            ...options
        };
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = this._getKeyCombo(e);
            if (key === this.options.nextProblemKey) {
                e.preventDefault();
                this.goToNextProblem();
            } else if (key === this.options.prevProblemKey) {
                e.preventDefault();
                this.goToPrevProblem();
            } else if (key === this.options.applyFixKey) {
                e.preventDefault();
                this.applyFixAtCursor();
            }
        });
    }

    _getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
            parts.push(key);
        }
        return parts.join('+');
    }

    goToNextProblem() {
        const problems = this.getProblems();
        if (problems.length === 0) {
            alert('No hay problemas detectados.');
            return;
        }
        const cursor = this.editor.getCursor();
        const currentLine = cursor.line + 1;
        const next = problems.find(p => p.line > currentLine);
        if (next) {
            this._goToLine(next.line);
        } else {
            this._goToLine(problems[0].line);
        }
    }

    goToPrevProblem() {
        const problems = this.getProblems();
        if (problems.length === 0) {
            alert('No hay problemas detectados.');
            return;
        }
        const cursor = this.editor.getCursor();
        const currentLine = cursor.line + 1;
        const prev = problems.reverse().find(p => p.line < currentLine);
        if (prev) {
            this._goToLine(prev.line);
        } else {
            this._goToLine(problems[problems.length - 1].line);
        }
    }

    applyFixAtCursor() {
        const cursor = this.editor.getCursor();
        const line = cursor.line + 1;
        const problems = this.getProblems();
        const lineProblems = problems.filter(p => p.line === line);
        if (lineProblems.length === 0) {
            alert('No hay problemas en esta línea.');
            return;
        }
        const problem = lineProblems.find(p => p.fix);
        if (!problem) {
            alert('Ningún problema en esta línea tiene corrección automática.');
            return;
        }
        this.applyFix(problem);
    }

    _goToLine(line) {
        this.editor.setCursor({ line: line - 1, ch: 0 });
        this.editor.focus();
        this.editor.addLineClass(line - 1, 'background', 'cm-active-line');
        setTimeout(() => this.editor.removeLineClass(line - 1, 'background', 'cm-active-line'), 500);
    }
}