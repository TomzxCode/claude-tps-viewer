/**
 * CacheManager - IndexedDB caching for processed file results
 */

const DB_NAME = 'TPSViewerCache';
const STORE_NAME = 'processedFiles';
const DB_VERSION = 1;

class CacheManager {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize IndexedDB database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store with fileKey as key
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'fileKey' });
                    // Create index for filename lookups
                    store.createIndex('filename', 'filename', { unique: false });
                }
            };
        });
    }

    /**
     * Get cached data for a file key
     * @param {string} fileKey - Composite key (filename:size:lastModified)
     * @returns {Object|null} Cached data or null if not found
     */
    async get(fileKey) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(fileKey);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
        });
    }

    /**
     * Store processed data for a file
     * @param {string} fileKey - Composite key (filename:size:lastModified)
     * @param {string} filename - Original filename
     * @param {Object} data - Processed data to cache
     */
    async set(fileKey, filename, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const entry = {
                fileKey,
                filename,
                processedAt: Date.now(),
                data
            };

            const request = store.put(entry);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Clear all cached data
     */
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    async getStats() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const countRequest = store.count();

            countRequest.onerror = () => reject(countRequest.error);
            countRequest.onsuccess = () => {
                resolve({ entryCount: countRequest.result });
            };
        });
    }
}

/**
 * Calculate cache key for a file
 * Uses filename, size, and last modified time to identify files
 * @param {File} file - File object
 * @returns {string} Composite key (filename:size:lastModified)
 */
function calculateFileKey(file) {
    const lastModified = file.lastModified || 0;
    return `${file.name}:${file.size}:${lastModified}`;
}
