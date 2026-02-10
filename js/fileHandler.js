/**
 * Handle directory selection using File System Access API
 */
class FileHandler {
    constructor(cacheManager = null) {
        this.cacheManager = cacheManager;
        this.selectButton = document.getElementById('select-directory');
        this.fileSelection = document.getElementById('file-selection');
        this.statusBar = document.getElementById('status-bar');
        this.statusText = document.getElementById('status-text');
        this.progressFill = document.getElementById('progress-fill');
        this.processingFile = document.getElementById('processing-file');
        this.currentFileName = document.getElementById('current-file-name');
        this.cacheStats = document.getElementById('cache-stats');
        this.cacheHits = document.getElementById('cache-hits');
        this.processingDetails = document.getElementById('processing-details');
        this.errorModal = document.getElementById('error-modal');
        this.errorMessage = document.getElementById('error-message');
        this.fallbackInput = document.getElementById('file-input');
        this.cacheHitCount = 0;
        this.processingStartTime = 0;

        this.init();
    }

    init() {
        console.log('[FileHandler] init called');
        if (!this.selectButton) {
            console.error('Select directory button not found');
            return;
        }
        this.selectButton.addEventListener('click', () => {
            console.log('[FileHandler] Select directory button clicked');
            this.selectDirectory();
        });

        const closeErrorBtn = document.getElementById('close-error');
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', () => {
                this.hideError();
            });
        }

        if (this.fallbackInput) {
            this.fallbackInput.addEventListener('change', (e) => this.handleFallbackInput(e));
        }

        // Clear cache button
        document.getElementById('clear-cache')?.addEventListener('click', () => this.clearCache());
    }

    async selectDirectory() {
        console.log('[FileHandler] selectDirectory called');
        try {
            // Try File System Access API first (Chrome/Edge)
            if ('showDirectoryPicker' in window) {
                console.log('[FileHandler] Using File System Access API');
                const dirHandle = await window.showDirectoryPicker();
                await this.readDirectory(dirHandle);
            } else {
                console.log('[FileHandler] Using fallback file input');
                // Fallback to traditional file input
                this.useFallbackInput();
            }
        } catch (e) {
            console.error('[FileHandler] selectDirectory error:', e);
            if (e.name !== 'AbortError') {
                this.showError(e.message);
            }
        }
    }

    async readDirectory(dirHandle) {
        console.log('[FileHandler] readDirectory called');
        const files = [];

        // Recursively scan directory for JSONL files
        await this.scanDirectory(dirHandle, files);

        console.log(`[FileHandler] Found ${files.length} total JSONL files`);

        // Filter for UUID-named files
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i;
        const validFiles = files.filter(f => uuidRegex.test(f.name));
        const skippedCount = files.length - validFiles.length;

        console.log(`[FileHandler] Filtered to ${validFiles.length} valid UUID-named files`);

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
        console.log('[FileHandler] useFallbackInput called');
        console.log('[FileHandler] Fallback input element:', this.fallbackInput);
        if (this.fallbackInput) {
            // Reset the input value to allow selecting the same files again
            this.fallbackInput.value = '';
            console.log('[FileHandler] Triggering fallback input click');
            try {
                this.fallbackInput.click();
                console.log('[FileHandler] Fallback input click completed');
            } catch (err) {
                console.error('[FileHandler] Error clicking fallback input:', err);
            }
        } else {
            console.error('[FileHandler] Fallback input element not found!');
        }
    }

    handleFallbackInput(e) {
        console.log('[FileHandler] handleFallbackInput called');
        console.log('[FileHandler] Event target files:', e.target.files);
        console.log('[FileHandler] Files count:', e.target.files.length);

        const files = Array.from(e.target.files).filter(f => f.name.endsWith('.jsonl'));
        console.log('[FileHandler] Filtered to .jsonl files:', files.length);

        if (files.length === 0) {
            this.showError('No JSONL files selected');
            return;
        }

        // Filter for UUID-named files
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i;
        const validFiles = files.filter(f => uuidRegex.test(f.name));
        const skippedCount = files.length - validFiles.length;

        console.log('[FileHandler] Filtered to UUID-named files:', validFiles.length);

        if (validFiles.length === 0) {
            this.showError('No valid JSONL files found (files must be named [uuid].jsonl)');
            return;
        }

        if (skippedCount > 0) {
            console.warn(`[FileHandler] Skipped ${skippedCount} file(s) with non-UUID names`);
        }

        console.log('[FileHandler] Calling processFiles with valid files');
        this.processFiles(validFiles);
    }

    async processFiles(files) {
        console.log(`[FileHandler] processFiles called with ${files.length} file(s)`);
        console.log(`[FileHandler] Before reset - cacheHitCount: ${this.cacheHitCount}`);
        this.cacheHitCount = 0;
        console.log(`[FileHandler] After reset - cacheHitCount: ${this.cacheHitCount}`);
        this.processingStartTime = Date.now();
        this.showStatus(`Processing ${files.length} files...`, 0);

        // Hide cache stats initially
        if (this.cacheStats) {
            this.cacheStats.classList.add('hidden');
        }

        this.updateCacheStats(0);
        this.hideProcessingDetails();
        this.hideCurrentFile();

        // Track which files we've already counted to prevent double-counting
        const countedFiles = new Set();

        try {
            console.log('[FileHandler] Calling processFiles from dataProcessor');
            const data = await processFiles(files, (processed, total, currentFile, isFromCache) => {
                const percentage = (processed / total) * 100;
                this.showStatus(`Processing ${processed}/${total} files...`, percentage);
                this.showCurrentFile(currentFile);

                if (isFromCache) {
                    // Only count each file once to prevent double-counting
                    if (!countedFiles.has(currentFile)) {
                        countedFiles.add(currentFile);
                        const oldCount = this.cacheHitCount;
                        this.cacheHitCount++;
                        console.log(`[FileHandler] Cache hit for ${currentFile}: ${oldCount} -> ${this.cacheHitCount} | isFromCache=${isFromCache}`);
                    } else {
                        console.log(`[FileHandler] DUPLICATE cache hit for ${currentFile}, skipping | isFromCache=${isFromCache}`);
                    }
                } else {
                    console.log(`[FileHandler] NOT cache hit for ${currentFile} | isFromCache=${isFromCache}`);
                }

                const currentHitCount = this.cacheHitCount;
                console.log(`[FileHandler] File ${currentFile}: processed=${processed}, cacheHits=${currentHitCount}`);
                console.log(`[FileHandler] Calling updateCacheStats with: ${currentHitCount}`);
                this.updateCacheStats(currentHitCount);
                console.log(`[FileHandler] Calling updateProcessingDetails with: processed=${processed}, cacheHits=${currentHitCount}`);
                this.updateProcessingDetails(processed, total, this.cacheHitCount);
            }, this.cacheManager);

            console.log(`[FileHandler] Processing complete:`, data.summary);
            console.log(`[FileHandler] Full data object:`, data);
            console.log(`[FileHandler] Final cache hit count: ${this.cacheHitCount}`);

            this.hideStatus();

            // Add data-loaded class to body
            document.body.classList.add('data-loaded');

            // Hide file selection section
            if (this.fileSelection) {
                this.fileSelection.classList.add('hidden');
            }

            // Emit event with processed data
            console.log(`[FileHandler] Dispatching dataLoaded event with:`, data);
            window.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));
        } catch (e) {
            console.error('[FileHandler] Error in processFiles:', e);
            this.hideStatus();
            this.showError(`Error processing files: ${e.message}`);
        }
    }

    showStatus(text, percentage) {
        if (this.statusBar) this.statusBar.classList.remove('hidden');
        if (this.statusText) this.statusText.textContent = text;
        if (this.progressFill) this.progressFill.style.width = `${percentage}%`;
    }

    updateCacheStats(hits) {
        // Always update the display, even when hits is 0
        if (this.cacheStats) {
            if (hits > 0) {
                this.cacheStats.classList.remove('hidden');
                console.log(`[FileHandler] updateCacheStats: Setting display to ${hits}, internal counter is ${this.cacheHitCount}`);
            } else {
                this.cacheStats.classList.add('hidden');
                console.log(`[FileHandler] updateCacheStats: Setting display to 0 (hiding)`);
            }
            if (this.cacheHits) {
                this.cacheHits.textContent = hits;
                console.log(`[FileHandler] updateCacheStats: Updated display element to "${hits}"`);
            }
        }
    }

    showCurrentFile(fileName) {
        if (this.processingFile) {
            this.processingFile.classList.remove('hidden');
            if (this.currentFileName) {
                this.currentFileName.textContent = fileName;
            }
        }
    }

    hideCurrentFile() {
        if (this.processingFile) {
            this.processingFile.classList.add('hidden');
        }
    }

    updateProcessingDetails(processed, total, cacheHits) {
        if (this.processingDetails) {
            const elapsed = ((Date.now() - this.processingStartTime) / 1000).toFixed(1);
            const remaining = processed > 0 ? ((elapsed / processed) * (total - processed)).toFixed(1) : 0;
            const cachePercent = ((cacheHits / processed) * 100).toFixed(0);

            this.processingDetails.classList.remove('hidden');
            this.processingDetails.textContent = `Elapsed: ${elapsed}s | Est. remaining: ${remaining}s | Cache hit rate: ${cachePercent}%`;
        }
    }

    hideProcessingDetails() {
        if (this.processingDetails) {
            this.processingDetails.classList.add('hidden');
        }
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

    async clearCache() {
        if (!this.cacheManager) return;
        try {
            console.log('[FileHandler] clearCache: Getting cache stats');
            const stats = await this.cacheManager.getStats();
            console.log('[FileHandler] clearCache: Current cache stats:', stats);
            const message = `Clear cache? This will remove ${stats.entryCount} cached entries and force all files to be reprocessed.`;

            if (confirm(message)) {
                console.log('[FileHandler] clearCache: User confirmed, clearing cache');
                await this.cacheManager.clear();
                console.log('[FileHandler] Cache cleared');

                // Reset cache hit counter
                this.cacheHitCount = 0;
                console.log('[FileHandler] Cache hit counter reset to 0. Current value:', this.cacheHitCount);

                // Hide cache stats display
                if (this.cacheStats) {
                    this.cacheStats.classList.add('hidden');
                    console.log('[FileHandler] Hidden cache stats display');
                }

                alert('Cache cleared successfully! All files will be reprocessed on next load.');
                console.log('[FileHandler] Calling reloadData');
                this.reloadData();
            } else {
                console.log('[FileHandler] User cancelled cache clear');
            }
        } catch (e) {
            console.error('[FileHandler] Error in clearCache:', e);
            this.showError(`Failed to clear cache: ${e.message}`);
        }
    }

    reloadData() {
        window.dispatchEvent(new CustomEvent('reloadRequested'));
    }
}
