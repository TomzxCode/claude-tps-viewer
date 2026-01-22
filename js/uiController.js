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

        this.init();
    }

    init() {
        // Listen for data loaded event
        window.addEventListener('dataLoaded', (e) => {
            this.currentData = e.detail;
            this.showDashboard();
        });

        // Period tab buttons
        this.periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.periodButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');

                const period = button.dataset.period;
                this.updateChart(period);
            });
        });

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
    }

    showDashboard() {
        if (!this.dashboard) return;

        this.dashboard.classList.remove('hidden');

        // Update summary cards
        if (this.summaryCards.totalSessions) {
            this.summaryCards.totalSessions.textContent = this.currentData.summary.totalSessions;
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

    renderSessionsTable() {
        if (!this.sessionsTable) return;

        let sessions = this.currentData.sessions.sort((a, b) => b.timestamp - a.timestamp);

        // Filter by model if selected
        if (this.currentModelFilter !== 'all') {
            sessions = sessions.filter(s => s.models && s.models.includes(this.currentModelFilter));
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

        // Initialize DataTables
        $(document).ready(() => {
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
}
