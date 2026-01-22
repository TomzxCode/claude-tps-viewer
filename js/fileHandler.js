/**
 * Handle directory selection using File System Access API
 */
class FileHandler {
    constructor() {
        this.selectButton = document.getElementById('select-directory');
        this.fileSelection = document.getElementById('file-selection');
        this.statusBar = document.getElementById('status-bar');
        this.statusText = document.getElementById('status-text');
        this.progressFill = document.getElementById('progress-fill');
        this.errorModal = document.getElementById('error-modal');
        this.errorMessage = document.getElementById('error-message');
        this.fallbackInput = document.getElementById('file-input');

        this.init();
    }

    init() {
        if (!this.selectButton) {
            console.error('Select directory button not found');
            return;
        }
        this.selectButton.addEventListener('click', () => this.selectDirectory());

        const closeErrorBtn = document.getElementById('close-error');
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', () => {
                this.hideError();
            });
        }

        if (this.fallbackInput) {
            this.fallbackInput.addEventListener('change', (e) => this.handleFallbackInput(e));
        }
    }

    async selectDirectory() {
        try {
            // Try File System Access API first (Chrome/Edge)
            if ('showDirectoryPicker' in window) {
                const dirHandle = await window.showDirectoryPicker();
                await this.readDirectory(dirHandle);
            } else {
                // Fallback to traditional file input
                this.useFallbackInput();
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                this.showError(e.message);
            }
        }
    }

    async readDirectory(dirHandle) {
        const files = [];

        // Recursively scan directory for JSONL files
        await this.scanDirectory(dirHandle, files);

        // Filter for UUID-named files
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i;
        const validFiles = files.filter(f => uuidRegex.test(f.name));
        const skippedCount = files.length - validFiles.length;

        if (validFiles.length === 0) {
            this.showError('No valid JSONL files found in directory (files must be named [uuid].jsonl)');
            return;
        }

        if (skippedCount > 0) {
            console.warn(`[FileHandler] Skipped ${skippedCount} file(s) with non-UUID names`);
        }

        await this.processFiles(validFiles);
    }

    async scanDirectory(dirHandle, files) {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.jsonl')) {
                const file = await entry.getFile();
                files.push(file);
            } else if (entry.kind === 'directory') {
                // Recursively scan subdirectories
                await this.scanDirectory(entry, files);
            }
        }
    }

    useFallbackInput() {
        if (this.fallbackInput) {
            this.fallbackInput.click();
        }
    }

    handleFallbackInput(e) {
        const files = Array.from(e.target.files).filter(f => f.name.endsWith('.jsonl'));

        if (files.length === 0) {
            this.showError('No JSONL files selected');
            return;
        }

        // Filter for UUID-named files
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i;
        const validFiles = files.filter(f => uuidRegex.test(f.name));
        const skippedCount = files.length - validFiles.length;

        if (validFiles.length === 0) {
            this.showError('No valid JSONL files found (files must be named [uuid].jsonl)');
            return;
        }

        if (skippedCount > 0) {
            console.warn(`[FileHandler] Skipped ${skippedCount} file(s) with non-UUID names`);
        }

        this.processFiles(validFiles);
    }

    async processFiles(files) {
        console.log(`[FileHandler] Starting to process ${files.length} file(s)`);
        this.showStatus(`Processing ${files.length} files...`, 0);

        try {
            const data = await processFiles(files, (processed, total) => {
                const percentage = (processed / total) * 100;
                this.showStatus(`Processing ${processed}/${total} files...`, percentage);
            });

            console.log(`[FileHandler] Processing complete:`, data.summary);

            this.hideStatus();

            // Add data-loaded class to body
            document.body.classList.add('data-loaded');

            // Hide file selection section
            if (this.fileSelection) {
                this.fileSelection.classList.add('hidden');
            }

            // Emit event with processed data
            window.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));
        } catch (e) {
            this.hideStatus();
            this.showError(e.message);
        }
    }

    showStatus(text, percentage) {
        if (this.statusBar) this.statusBar.classList.remove('hidden');
        if (this.statusText) this.statusText.textContent = text;
        if (this.progressFill) this.progressFill.style.width = `${percentage}%`;
    }

    hideStatus() {
        if (this.statusBar) this.statusBar.classList.add('hidden');
    }

    showError(message) {
        if (this.errorMessage) this.errorMessage.textContent = message;
        if (this.errorModal) this.errorModal.classList.remove('hidden');
    }

    hideError() {
        if (this.errorModal) this.errorModal.classList.add('hidden');
    }
}
