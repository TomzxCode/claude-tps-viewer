class SQLiteHandler {
    constructor(cacheManager = null) {
        this.cacheManager = cacheManager;
        this.selectButton = document.getElementById('select-sqlite');
        this.fileSelection = document.getElementById('file-selection');
        this.statusBar = document.getElementById('status-bar');
        this.statusText = document.getElementById('status-text');
        this.progressFill = document.getElementById('progress-fill');
        this.errorModal = document.getElementById('error-modal');
        this.errorMessage = document.getElementById('error-message');
        this.sqlJsReady = false;
        this.SQL = null;

        this.init();
    }

    async init() {
        if (!this.selectButton) {
            return;
        }

        this.selectButton.addEventListener('click', () => {
            this.selectSQLiteFile();
        });
    }

    async ensureSqlJsReady() {
        if (this.sqlJsReady) {
            return true;
        }

        if (typeof initSqlJs === 'undefined') {
            this.showError('sql.js library not loaded. Please refresh the page.');
            return false;
        }

        try {
            this.SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
            });
            this.sqlJsReady = true;
            return true;
        } catch (e) {
            this.showError(`Failed to initialize sql.js: ${e.message}`);
            return false;
        }
    }

    async selectSQLiteFile() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.db,.sqlite,.sqlite3';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
                    this.showError('Please select a valid SQLite database file (.db, .sqlite, .sqlite3)');
                    return;
                }

                await this.processSQLiteFile(file);
            };

            input.click();
        } catch (e) {
            if (e.name !== 'AbortError') {
                this.showError(e.message);
            }
        }
    }

    async processSQLiteFile(file) {
        this.showStatus('Loading SQLite database...', 0);

        const ready = await this.ensureSqlJsReady();
        if (!ready) return;

        try {
            this.showStatus('Reading file...', 25);
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            this.showStatus('Parsing database...', 50);
            const db = new this.SQL.Database(uint8Array);

            this.showStatus('Extracting metrics...', 75);
            const data = this.extractMetrics(db, file.name);

            db.close();

            this.showStatus('Processing complete!', 100);
            this.hideStatus();

            document.body.classList.add('data-loaded');
            if (this.fileSelection) {
                this.fileSelection.classList.add('hidden');
            }

            window.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));

        } catch (e) {
            this.hideStatus();
            this.showError(`Failed to process SQLite database: ${e.message}`);
        }
    }

    extractMetrics(db, filename) {
        const query = `
            SELECT 
                json_extract(data, '$.modelID') as model_id,
                json_extract(data, '$.providerID') as provider,
                json_extract(data, '$.tokens.input') as input_tokens,
                json_extract(data, '$.tokens.output') as output_tokens,
                (json_extract(data, '$.time.completed') - json_extract(data, '$.time.created')) / 1000.0 as duration_sec,
                time_created
            FROM message
            WHERE data LIKE '%"role":"assistant"%'
              AND json_extract(data, '$.tokens.output') > 0
              AND json_extract(data, '$.time.completed') IS NOT NULL
              AND json_extract(data, '$.time.created') IS NOT NULL
        `;

        const results = [];
        const stmt = db.prepare(query);

        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
        }
        stmt.free();

        const allTPSData = [];
        const sessions = new Map();
        let totalTokens = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (const row of results) {
            const timestamp = new Date(row.time_created);
            const model = row.model_id || 'unknown';
            const sessionId = `opencode-${timestamp.toISOString().split('T')[0]}`;
            const inputTokens = row.input_tokens || 0;
            const outputTokens = row.output_tokens || 0;
            const durationSeconds = row.duration_sec || 0;

            if (durationSeconds <= 0 || outputTokens <= 0) {
                continue;
            }

            const tps = (inputTokens + outputTokens) / durationSeconds;
            const itps = inputTokens / durationSeconds;
            const otps = outputTokens / durationSeconds;

            const tpsDataPoint = {
                sessionId,
                timestamp,
                tps,
                itps,
                otps,
                totalTokens: inputTokens + outputTokens,
                inputTokens,
                outputTokens,
                durationSeconds,
                model,
                models: [model]
            };

            allTPSData.push(tpsDataPoint);

            totalTokens += inputTokens + outputTokens;
            totalInputTokens += inputTokens;
            totalOutputTokens += outputTokens;

            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, {
                    id: sessionId,
                    filename: filename,
                    turnCount: 0,
                    totalTokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTPS: 0,
                    totalITPS: 0,
                    totalOTPS: 0,
                    timestamp,
                    models: new Set()
                });
            }

            const session = sessions.get(sessionId);
            session.turnCount++;
            session.totalTokens += inputTokens + outputTokens;
            session.inputTokens += inputTokens;
            session.outputTokens += outputTokens;
            session.totalTPS += tps;
            session.totalITPS += itps;
            session.totalOTPS += otps;
            session.models.add(model);

            if (timestamp < session.timestamp) {
                session.timestamp = timestamp;
            }
        }

        const sessionsArray = Array.from(sessions.values()).map(s => ({
            id: s.id,
            filename: s.filename,
            turnCount: s.turnCount,
            totalTokens: s.totalTokens,
            inputTokens: s.inputTokens,
            outputTokens: s.outputTokens,
            averageTPS: s.turnCount > 0 ? s.totalTPS / s.turnCount : 0,
            averageITPS: s.turnCount > 0 ? s.totalITPS / s.turnCount : 0,
            averageOTPS: s.turnCount > 0 ? s.totalOTPS / s.turnCount : 0,
            timestamp: s.timestamp,
            models: Array.from(s.models)
        }));

        const averageTPS = allTPSData.length > 0
            ? allTPSData.reduce((sum, d) => sum + d.tps, 0) / allTPSData.length
            : 0;
        const averageITPS = allTPSData.length > 0
            ? allTPSData.reduce((sum, d) => sum + d.itps, 0) / allTPSData.length
            : 0;
        const averageOTPS = allTPSData.length > 0
            ? allTPSData.reduce((sum, d) => sum + d.otps, 0) / allTPSData.length
            : 0;

        const tpsValues = allTPSData.map(d => d.tps);
        const itpsValues = allTPSData.map(d => d.itps);
        const otpsValues = allTPSData.map(d => d.otps);

        const tpsPercentiles = calculatePercentiles(tpsValues);
        const itpsPercentiles = calculatePercentiles(itpsValues);
        const otpsPercentiles = calculatePercentiles(otpsValues);

        const modelStats = aggregateByModel(allTPSData);

        return {
            sessions: sessionsArray,
            allTPSData,
            modelStats,
            summary: {
                filesScanned: 1,
                filesProcessed: 1,
                filesSkipped: 0,
                filesFromCache: 0,
                totalSessions: sessionsArray.length,
                totalTurns: allTPSData.length,
                totalTokens,
                totalInputTokens,
                totalOutputTokens,
                averageTPS,
                averageITPS,
                averageOTPS,
                tpsPercentiles,
                itpsPercentiles,
                otpsPercentiles,
                models: modelStats.map(m => m.model),
                sourceType: 'sqlite'
            }
        };
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
}
