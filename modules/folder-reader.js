// modules/folder-reader.js
// (Sin cambios, lo incluyo para que el código sea completo)

export class FolderReader {
    constructor(editor, analyzeFunction) {
        this.editor = editor;
        this.analyzeFunction = analyzeFunction;
        this.files = [];
        this.selectedFiles = new Set();
        this.currentFileHandle = null;
        this.currentFileName = '';
        this.initUI();
    }

    initUI() {
        setTimeout(() => {
            const toolbar = document.querySelector('.toolbar');
            if (!toolbar) {
                console.warn('Toolbar no encontrado, los botones no se añadirán.');
                return;
            }

            if (!document.getElementById('open-folder-reader')) {
                const btnFolder = document.createElement('button');
                btnFolder.id = 'open-folder-reader';
                btnFolder.textContent = '📁 Abrir carpeta';
                btnFolder.style.background = '#6c5ce7';
                toolbar.appendChild(btnFolder);
                btnFolder.addEventListener('click', () => this.togglePanel());
            }

            if (!document.getElementById('open-file-reader')) {
                const btnFile = document.createElement('button');
                btnFile.id = 'open-file-reader';
                btnFile.textContent = '📄 Abrir archivo';
                btnFile.style.background = '#27ae60';
                toolbar.appendChild(btnFile);
                btnFile.addEventListener('click', () => this.openSingleFile());
            }

            if (!document.getElementById('save-current-file')) {
                const btnSave = document.createElement('button');
                btnSave.id = 'save-current-file';
                btnSave.textContent = '💾 Guardar';
                btnSave.style.background = '#2980b9';
                btnSave.disabled = true;
                toolbar.appendChild(btnSave);
                btnSave.addEventListener('click', () => this.saveCurrentFile());
            }

            if (!document.getElementById('save-as-file')) {
                const btnSaveAs = document.createElement('button');
                btnSaveAs.id = 'save-as-file';
                btnSaveAs.textContent = '💾 Guardar como...';
                btnSaveAs.style.background = '#3498db';
                toolbar.appendChild(btnSaveAs);
                btnSaveAs.addEventListener('click', () => this.saveAsFile());
            }
        }, 100);

        this.createPanel();
    }

    createPanel() {
        if (document.getElementById('folder-reader-panel')) return;

        this.container = document.createElement('div');
        this.container.id = 'folder-reader-panel';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 2000;
            display: none;
            overflow-y: auto;
            font-family: 'Inter', sans-serif;
        `;

        this.container.innerHTML = `
            <h3 style="margin-top:0;">📁 Analizar carpeta</h3>
            <button id="select-folder-btn" style="margin-bottom:15px;">Seleccionar carpeta</button>
            <div id="folder-file-list" style="margin-bottom:15px; max-height:300px; overflow-y:auto; border:1px solid #ccc; padding:10px; border-radius:6px;">
                <p style="color:#888;">Selecciona una carpeta para ver los archivos.</p>
            </div>
            <div style="display:flex; gap:10px; justify-content:space-between; align-items:center;">
                <div>
                    <button id="select-none-btn" style="background:#95a5a6;">🔘 Deseleccionar todos</button>
                </div>
                <div>
                    <button id="analyze-selected-btn" disabled>▶️ Analizar seleccionados</button>
                    <button id="close-folder-panel">❌ Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        document.getElementById('select-folder-btn').addEventListener('click', () => this.selectFolder());
        document.getElementById('select-none-btn').addEventListener('click', () => this.deselectAll());
        document.getElementById('analyze-selected-btn').addEventListener('click', () => this.analyzeSelected());
        document.getElementById('close-folder-panel').addEventListener('click', () => this.togglePanel(false));
    }

    togglePanel(show) {
        if (!this.container) return;
        if (show === undefined) show = this.container.style.display === 'none';
        this.container.style.display = show ? 'block' : 'none';
    }

    async selectFolder() {
        try {
            const dirHandle = await window.showDirectoryPicker();
            this.files = [];
            await this.readDirectory(dirHandle, '');
            this.renderFileList();
            document.getElementById('analyze-selected-btn').disabled = false;
        } catch (err) {
            console.error('Error al seleccionar carpeta:', err);
            alert('No se pudo acceder a la carpeta.');
        }
    }

    async readDirectory(dirHandle, basePath) {
        for await (const entry of dirHandle.values()) {
            const fullPath = basePath ? `${basePath}/${entry.name}` : entry.name;
            if (entry.kind === 'directory') {
                await this.readDirectory(entry, fullPath);
            } else if (entry.name.endsWith('.js')) {
                const file = await entry.getFile();
                const content = await file.text();
                this.files.push({
                    name: fullPath,
                    handle: entry,
                    content: content
                });
            }
        }
    }

    renderFileList() {
        const listDiv = document.getElementById('folder-file-list');
        if (this.files.length === 0) {
            listDiv.innerHTML = '<p style="color:#888;">No se encontraron archivos .js.</p>';
            return;
        }

        const html = this.files.map((f, index) => `
            <div style="margin-bottom:5px;">
                <label>
                    <input type="checkbox" class="file-checkbox" data-index="${index}" checked>
                    ${f.name}
                </label>
            </div>
        `).join('');

        listDiv.innerHTML = html;

        document.querySelectorAll('.file-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    this.selectedFiles.add(idx);
                } else {
                    this.selectedFiles.delete(idx);
                }
            });
        });

        this.selectedFiles = new Set(this.files.map((_, i) => i));
    }

    deselectAll() {
        document.querySelectorAll('.file-checkbox').forEach(cb => {
            cb.checked = false;
        });
        this.selectedFiles.clear();
    }

    async openSingleFile() {
        try {
            if (!window.showOpenFilePicker) {
                alert('Tu navegador no soporta la apertura avanzada de archivos. Usa Chrome, Edge u Opera.');
                return;
            }

            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Archivos de código',
                    accept: {
                        'text/javascript': ['.js', '.mjs'],
                        'text/yaml': ['.yaml', '.yml'],
                        'text/plain': ['.txt']
                    }
                }],
                multiple: false
            });

            const file = await fileHandle.getFile();
            const content = await file.text();
            const fileName = file.name;

            this.currentFileHandle = fileHandle;
            this.currentFileName = fileName;
            document.getElementById('save-current-file').disabled = false;

            this.editor.setValue(content);

            try {
                const problems = this.analyzeFunction(content);
                this.showGroupedResults([{
                    file: fileName,
                    problems: problems,
                    error: null
                }]);
            } catch (err) {
                this.showGroupedResults([{
                    file: fileName,
                    problems: [{
                        ruleName: 'Error de análisis',
                        severity: 'alta',
                        message: `Error al analizar: ${err.message}`,
                        line: 1,
                        fix: false
                    }],
                    error: err.message
                }]);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error al abrir archivo:', err);
                alert('No se pudo abrir el archivo.');
            }
        }
    }

    async saveCurrentFile() {
        if (!this.currentFileHandle) {
            alert('No hay ningún archivo abierto para guardar. Usa "Abrir archivo" primero.');
            return;
        }

        try {
            const writable = await this.currentFileHandle.createWritable();
            await writable.write(this.editor.getValue());
            await writable.close();
            alert('Archivo guardado correctamente.');
        } catch (err) {
            console.error('Error al guardar:', err);
            alert('No se pudo guardar el archivo.');
        }
    }

    async saveAsFile() {
        try {
            if (!window.showSaveFilePicker) {
                alert('Tu navegador no soporta guardar archivos. Usa Chrome, Edge u Opera.');
                return;
            }

            const fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'Archivo JavaScript',
                    accept: { 'text/javascript': ['.js'] }
                }]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(this.editor.getValue());
            await writable.close();

            this.currentFileHandle = fileHandle;
            this.currentFileName = fileHandle.name;
            document.getElementById('save-current-file').disabled = false;

            alert('Archivo guardado como ' + fileHandle.name);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error al guardar como:', err);
                alert('No se pudo guardar el archivo.');
            }
        }
    }

    analyzeSelected() {
        const indices = Array.from(this.selectedFiles).sort((a,b) => a-b);
        if (indices.length === 0) {
            alert('Selecciona al menos un archivo.');
            return;
        }

        const problemsList = document.getElementById('problems-list');
        problemsList.innerHTML = '<div class="problem-item" style="border-left-color: #888;">Analizando...</div>';

        const allResults = [];
        indices.forEach(idx => {
            const file = this.files[idx];
            try {
                const problems = this.analyzeFunction(file.content);
                allResults.push({
                    file: file.name,
                    problems: problems,
                    error: null,
                    handle: file.handle
                });
            } catch (e) {
                allResults.push({
                    file: file.name,
                    problems: [{
                        ruleName: 'Error de análisis',
                        severity: 'alta',
                        message: `Error al analizar: ${e.message}`,
                        line: 1,
                        fix: false
                    }],
                    error: e.message,
                    handle: file.handle
                });
            }
        });

        this.showGroupedResults(allResults);
        this.togglePanel(false);
    }

    showGroupedResults(results) {
        const problemsList = document.getElementById('problems-list');
        if (results.length === 0) {
            problemsList.innerHTML = '<div class="problem-item" style="border-left-color: #2ecc71;">✅ No se encontraron problemas.</div>';
            return;
        }

        let html = '';
        results.forEach(r => {
            if (r.problems.length === 0) return;
            html += `<h4 style="margin:20px 0 5px; color:#2c3e50;">📄 ${r.file}</h4>`;
            r.problems.forEach(p => {
                html += `
                    <div class="problem-item severity-${p.severity}" data-line="${p.line}" data-file="${r.file}" data-handle-index="${results.indexOf(r)}" title="${p.message}">
                        <strong>${p.ruleName}</strong> <span style="color:#888;">[línea ${p.line}]</span>
                        <p>${p.message}</p>
                        <button class="goto-btn" data-file="${r.file}" data-line="${p.line}" data-handle-index="${results.indexOf(r)}">🔍 Ir a línea</button>
                    </div>
                `;
            });
        });

        problemsList.innerHTML = html || '<div class="problem-item" style="border-left-color: #2ecc71;">✅ No se encontraron problemas.</div>';

        document.querySelectorAll('.goto-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const line = parseInt(e.target.dataset.line);
                const file = e.target.dataset.file;
                const handleIndex = parseInt(e.target.dataset.handleIndex);
                const result = results[handleIndex];
                this.goToFileLine(result, line);
            });
        });

        document.querySelectorAll('.problem-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                const line = parseInt(item.dataset.line);
                const file = item.dataset.file;
                const handleIndex = parseInt(item.dataset.handleIndex);
                const result = results[handleIndex];
                this.goToFileLine(result, line);
            });
        });
    }

    goToFileLine(result, line) {
        if (result && result.handle) {
            this.currentFileHandle = result.handle;
            this.currentFileName = result.file;
            document.getElementById('save-current-file').disabled = false;
        }

        if (result) {
            const file = this.files.find(f => f.name === result.file);
            if (file) {
                this.editor.setValue(file.content);
            } else {
                alert('No se puede cargar el archivo. Abre el archivo individualmente.');
                return;
            }
            setTimeout(() => {
                this.editor.setCursor({ line: line - 1, ch: 0 });
                this.editor.focus();
                this.editor.addLineClass(line - 1, 'background', 'cm-active-line');
                setTimeout(() => this.editor.removeLineClass(line - 1, 'background', 'cm-active-line'), 500);
            }, 50);
        } else {
            alert('No se pudo cargar el archivo.');
        }
    }
}