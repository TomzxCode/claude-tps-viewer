/**
 * Manage UI state and interactions
 */
class UIController {
    constructor(chartRenderer) {
        this.chartRenderer = chartRenderer;
        this.dashboard = document.getElementById('dashboard');
        this.summaryCards = {
            totalSessions: document.getElementById('total-sessions'),
            averageTPS: document.getElementById('average-tps'),
            averageITPS: document.getElementById('average-itps'),
            averageOTPS: document.getElementById('average-otps'),
            totalInputTokens: document.getElementById('total-input-tokens'),
            totalOutputTokens: document.getElementById('total-output-tokens'),
            totalTokens: document.getElementById('total-tokens')
        };
        this.sessionsTable = document.getElementById('sessions-table');
        this.periodButtons = document.querySelectorAll('.time-period-tabs button');
        this.modelStats = document.getElementById('model-stats');
        this.modelSelect = document.getElementById('model-select');
        this.modelSelectChart = document.getElementById('model-select-chart');

        this.currentData = null;
        this.dataTable = null;
        this.currentModelFilter = 'all';
        this.dateRange = { from: null, to: null };
        this.isInitialized = false;

        this.init();
    }

    init() {
        console.log('[UIController] init called, isInitialized:', this.isInitialized);

        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('[UIController] Already initialized, skipping');
            return;
        }

        this.isInitialized = true;

        // Listen for data loaded event
        this.handleDataLoaded = (e) => {
            console.log('[UIController] dataLoaded event received, detail:', e.detail);
            console.log('[UIController] detail type:', typeof e.detail);
            console.log('[UIController] detail keys:', e.detail ? Object.keys(e.detail) : 'none');

            this.currentData = e.detail;
            this.showDashboard();
        };
        window.addEventListener('dataLoaded', this.handleDataLoaded);

        // Listen for reload requested event
        window.addEventListener('reloadRequested', () => {
            this.reloadData();
        });

        // Period tab buttons
        this.periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.periodButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');

                const period = button.dataset.period;
                this.updateChart(period);
            });
        });

        // Chart type buttons
        document.querySelectorAll('.chart-type-buttons button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.chart-type-buttons button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');

                const chartType = button.dataset.chartType;
                this.updateChartForChartType(chartType);
            });
        });

        // Date range filter
        document.getElementById('apply-date-filter')?.addEventListener('click', () => this.applyDateFilter());
        document.getElementById('clear-date-filter')?.addEventListener('click', () => this.clearDateFilter());

        // Model filter dropdowns (sync both)
        const onModelChange = (e) => {
            this.currentModelFilter = e.target.value;
            // Sync both dropdowns
            if (this.modelSelect) this.modelSelect.value = e.target.value;
            if (this.modelSelectChart) this.modelSelectChart.value = e.target.value;
            this.renderSessionsTable();
            this.updateChartForModel();
        };

        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', onModelChange);
        }
        if (this.modelSelectChart) {
            this.modelSelectChart.addEventListener('change', onModelChange);
        }

        // Top control buttons
        document.getElementById('reload-data')?.addEventListener('click', () => this.reloadData());
        document.getElementById('export-data')?.addEventListener('click', () => this.exportData());
        document.getElementById('dark-mode-toggle')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('help-button')?.addEventListener('click', () => this.showHelp());

        // Close help modal
        document.getElementById('close-help')?.addEventListener('click', () => this.hideHelp());

        // Load saved dark mode preference
        this.loadDarkModePreference();

        // Global keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    showDashboard() {
        if (!this.dashboard) return;

        console.log('[UIController] showDashboard called');
        console.log('[UIController] currentData:', this.currentData);
        console.log('[UIController] summaryCards:', this.summaryCards);

        if (!this.currentData) {
            console.error('[UIController] ERROR: currentData is null or undefined!');
            return;
        }

        if (!this.currentData.summary) {
            console.error('[UIController] ERROR: currentData.summary is missing!');
            return;
        }

        this.dashboard.classList.remove('hidden');
        document.getElementById('top-controls').classList.remove('hidden');

        // Update summary cards
        if (this.summaryCards.totalSessions) {
            const value = this.currentData.summary.totalSessions;
            console.log('[UIController] Setting totalSessions to:', value, 'element:', this.summaryCards.totalSessions);
            this.summaryCards.totalSessions.textContent = value;
        }
        if (this.summaryCards.averageTPS) {
            this.summaryCards.averageTPS.textContent = this.currentData.summary.averageTPS.toFixed(2);
        }
        if (this.summaryCards.averageITPS) {
            this.summaryCards.averageITPS.textContent = this.currentData.summary.averageITPS.toFixed(2);
        }
        if (this.summaryCards.averageOTPS) {
            this.summaryCards.averageOTPS.textContent = this.currentData.summary.averageOTPS.toFixed(2);
        }
        if (this.summaryCards.totalInputTokens) {
            this.summaryCards.totalInputTokens.textContent = this.currentData.summary.totalInputTokens.toLocaleString();
        }
        if (this.summaryCards.totalOutputTokens) {
            this.summaryCards.totalOutputTokens.textContent = this.currentData.summary.totalOutputTokens.toLocaleString();
        }
        if (this.summaryCards.totalTokens) {
            this.summaryCards.totalTokens.textContent = this.currentData.summary.totalTokens.toLocaleString();
        }

        // Update percentile cards
        this.updatePercentileCards();

        // Render model stats
        this.renderModelStats();

        // Populate model filter
        this.populateModelFilter();

        // Render initial chart
        this.updateChart('session');

        // Render sessions table
        this.renderSessionsTable();
    }

    updatePercentileCards() {
        const updateCard = (prefix, percentiles) => {
            for (const p of ['p50', 'p75', 'p95', 'pMax']) {
                const elementId = p === 'pMax' ? `${prefix}-pmax` : `${prefix}-${p.toLowerCase()}`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = percentiles[p].toFixed(2);
                }
            }
        };

        if (this.currentData.summary.tpsPercentiles) {
            updateCard('tps', this.currentData.summary.tpsPercentiles);
        }
        if (this.currentData.summary.itpsPercentiles) {
            updateCard('itps', this.currentData.summary.itpsPercentiles);
        }
        if (this.currentData.summary.otpsPercentiles) {
            updateCard('otps', this.currentData.summary.otpsPercentiles);
        }
    }

    renderModelStats() {
        if (!this.modelStats || !this.currentData.modelStats) return;

        const modelStats = this.currentData.modelStats;

        this.modelStats.innerHTML = `
            <div class="model-stats-grid">
                ${modelStats.map(stat => `
                    <div class="model-stat-card">
                        <h4>${this.escapeHtml(stat.model)}</h4>
                        <div class="stat-row">
                            <span>Avg TPS:</span>
                            <strong>${stat.averageTPS.toFixed(2)}</strong>
                        </div>
                        <div class="stat-row percentile-row">
                            <span>TPS p50/p75/p95/pMax:</span>
                            <strong>${this.formatPercentiles(stat.tpsPercentiles)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Avg ITPS:</span>
                            <strong>${stat.averageITPS.toFixed(2)}</strong>
                        </div>
                        <div class="stat-row percentile-row">
                            <span>ITPS p50/p75/p95/pMax:</span>
                            <strong>${this.formatPercentiles(stat.itpsPercentiles)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Avg OTPS:</span>
                            <strong>${stat.averageOTPS.toFixed(2)}</strong>
                        </div>
                        <div class="stat-row percentile-row">
                            <span>OTPS p50/p75/p95/pMax:</span>
                            <strong>${this.formatPercentiles(stat.otpsPercentiles)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Turns:</span>
                            <strong>${stat.turnCount.toLocaleString()}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Input Tokens:</span>
                            <strong>${stat.totalInputTokens.toLocaleString()}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Output Tokens:</span>
                            <strong>${stat.totalOutputTokens.toLocaleString()}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Total Tokens:</span>
                            <strong>${stat.totalTokens.toLocaleString()}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Duration:</span>
                            <strong>${this.formatDuration(stat.totalDuration)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatPercentiles(percentiles) {
        if (!percentiles) return 'N/A';
        return `${percentiles.p50.toFixed(2)} / ${percentiles.p75.toFixed(2)} / ${percentiles.p95.toFixed(2)} / ${percentiles.pMax.toFixed(2)}`;
    }

    populateModelFilter() {
        if (!this.currentData.modelStats) return;

        // Populate both dropdowns
        [this.modelSelect, this.modelSelectChart].forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="all">All Models</option>';
            this.currentData.modelStats.forEach(stat => {
                const option = document.createElement('option');
                option.value = stat.model;
                option.textContent = stat.model;
                select.appendChild(option);
            });
        });
    }

    updateChart(period) {
        if (!this.currentData || !this.chartRenderer) return;

        let tpsData = this.currentData.allTPSData;

        // Filter by model if selected
        if (this.currentModelFilter !== 'all') {
            tpsData = tpsData.filter(d => d.model === this.currentModelFilter);
        }

        this.chartRenderer.renderChart(tpsData, period);
    }

    updateChartForModel() {
        const activePeriod = document.querySelector('.time-period-tabs button.active');
        const period = activePeriod ? activePeriod.dataset.period : 'session';
        this.updateChart(period);
    }

    updateChartForChartType(chartType) {
        const activePeriod = document.querySelector('.time-period-tabs button.active');
        const period = activePeriod ? activePeriod.dataset.period : 'session';
        this.updateChart(period, chartType);
    }

    updateChart(period, chartType) {
        if (!this.currentData || !this.chartRenderer) return;

        let tpsData = this.currentData.allTPSData;

        // Filter by model if selected
        if (this.currentModelFilter !== 'all') {
            tpsData = tpsData.filter(d => d.model === this.currentModelFilter);
        }

        // Filter by date range if set
        if (this.dateRange.from || this.dateRange.to) {
            tpsData = tpsData.filter(d => {
                const timestamp = d.timestamp.getTime();
                if (this.dateRange.from && timestamp < this.dateRange.from) return false;
                if (this.dateRange.to && timestamp > this.dateRange.to) return false;
                return true;
            });
        }

        // Use provided chart type or get from active button
        if (!chartType) {
            const activeChartType = document.querySelector('.chart-type-buttons button.active');
            chartType = activeChartType ? activeChartType.dataset.chartType : 'bar';
        }

        this.chartRenderer.renderChart(tpsData, period, chartType);
    }

    renderSessionsTable() {
        if (!this.sessionsTable) return;

        let sessions = this.currentData.sessions.sort((a, b) => b.timestamp - a.timestamp);

        // Filter by model if selected
        if (this.currentModelFilter !== 'all') {
            sessions = sessions.filter(s => s.models && s.models.includes(this.currentModelFilter));
        }

        // Filter by date range if set
        if (this.dateRange.from || this.dateRange.to) {
            sessions = sessions.filter(s => {
                const timestamp = s.timestamp.getTime();
                if (this.dateRange.from && timestamp < this.dateRange.from) return false;
                if (this.dateRange.to && timestamp > this.dateRange.to) return false;
                return true;
            });
        }

        // Build table data for DataTables
        const tableData = sessions.map(session => {
            // Format: YYYY-MM-DD HH:MM:SS
            const dateStr = session.timestamp.toLocaleDateString('en-CA');
            const timeStr = session.timestamp.toLocaleTimeString('en-CA', { hour12: false });
            return [
                `<code>${this.escapeHtml(session.id)}</code>`,
                `${dateStr} ${timeStr}`,
                session.turnCount,
                session.totalTokens.toLocaleString(),
                session.inputTokens.toLocaleString(),
                session.outputTokens.toLocaleString(),
                session.averageTPS.toFixed(2),
                session.averageITPS.toFixed(2),
                session.averageOTPS.toFixed(2),
                session.models && session.models.length > 0 ? session.models.join(', ') : 'unknown'
            ];
        });

        this.sessionsTable.innerHTML = `
            <table id="sessions-datatable" class="display">
                <thead>
                    <tr>
                        <th>Session ID</th>
                        <th>Date & Time</th>
                        <th>Turns</th>
                        <th>Total Tokens</th>
                        <th>Input Tokens</th>
                        <th>Output Tokens</th>
                        <th>Avg TPS</th>
                        <th>Avg ITPS</th>
                        <th>Avg OTPS</th>
                        <th>Models</th>
                    </tr>
                </thead>
            </table>
        `;

        // Destroy existing table if it exists
        if (this.dataTable) {
            this.dataTable.destroy();
            this.dataTable = null;
        }

        // Initialize DataTables directly (DOM already ready)
        this.dataTable = $('#sessions-datatable').DataTable({
            data: tableData,
            pageLength: 25,
            order: [[1, 'desc']],
            columnControl: ['order', ['orderAsc', 'orderDesc', 'search']],
            ordering: {
                indicators: false,
                handler: false
            }
        });
    }

    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}m ${secs}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    reloadData() {
        // Hide dashboard and show file selection
        this.dashboard.classList.add('hidden');
        document.getElementById('top-controls').classList.add('hidden');
        document.getElementById('file-selection').classList.remove('hidden');
        document.body.classList.remove('data-loaded');
        this.currentData = null;
    }

    exportData() {
        if (!this.currentData) return;

        const exportData = {
            summary: this.currentData.summary,
            modelStats: this.currentData.modelStats,
            sessions: this.currentData.sessions,
            tpsData: this.currentData.allTPSData,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claude-tps-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
        }
    }

    loadDarkModePreference() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            document.body.classList.add('dark-mode');
            const toggleBtn = document.getElementById('dark-mode-toggle');
            if (toggleBtn) {
                toggleBtn.textContent = '☀️';
            }
        }
    }

    showHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
        }
    }

    hideHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('hidden');
        }
    }

    applyDateFilter() {
        const fromDate = document.getElementById('date-from')?.value;
        const toDate = document.getElementById('date-to')?.value;

        this.dateRange.from = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : null;
        this.dateRange.to = toDate ? new Date(toDate + 'T23:59:59').getTime() : null;

        const activePeriod = document.querySelector('.time-period-tabs button.active');
        const period = activePeriod ? activePeriod.dataset.period : 'session';
        this.updateChart(period);
        this.renderSessionsTable();
    }

    clearDateFilter() {
        this.dateRange = { from: null, to: null };
        const fromDateInput = document.getElementById('date-from');
        const toDateInput = document.getElementById('date-to');
        if (fromDateInput) fromDateInput.value = '';
        if (toDateInput) toDateInput.value = '';

        const activePeriod = document.querySelector('.time-period-tabs button.active');
        const period = activePeriod ? activePeriod.dataset.period : 'session';
        this.updateChart(period);
        this.renderSessionsTable();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Don't trigger if CTRL, ALT, or META are pressed (but allow Shift)
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return;
            }

            const key = e.key.toLowerCase();

            switch (key) {
                case 'r':
                    if (document.getElementById('reload-data')) {
                        e.preventDefault();
                        this.reloadData();
                    }
                    break;
                case 'e':
                    if (document.getElementById('export-data')) {
                        e.preventDefault();
                        this.exportData();
                    }
                    break;
                case 'c':
                    // Only trigger clear cache if Shift is pressed (Shift+C)
                    if (e.shiftKey && document.getElementById('clear-cache')) {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('clearCacheRequested'));
                    }
                    break;
                case 'd':
                    if (document.getElementById('dark-mode-toggle')) {
                        e.preventDefault();
                        this.toggleDarkMode();
                    }
                    break;
                case 'h':
                    if (document.getElementById('help-button')) {
                        e.preventDefault();
                        this.showHelp();
                    }
                    break;
                case 'escape':
                    this.hideHelp();
                    document.getElementById('error-modal')?.classList.add('hidden');
                    break;
            }
        });

        // Listen for clear cache requested
        window.addEventListener('clearCacheRequested', () => {
            if (window.app && window.app.fileHandler) {
                window.app.fileHandler.clearCache();
            }
        });
    }
}
