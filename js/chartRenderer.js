/**
 * Handle Plotly.js rendering
 */
class ChartRenderer {
    constructor() {
        this.chartDiv = document.getElementById('tps-chart');
        this.currentPeriod = 'session';
    }

    renderChart(data, period = 'session') {
        if (!this.chartDiv) {
            console.error('Chart div not found');
            return;
        }

        const aggregatedData = aggregateByPeriod(data, period);

        const labels = aggregatedData.map(d => d.label);
        const tpsValues = aggregatedData.map(d => d.averageTPS);
        const itpsValues = aggregatedData.map(d => d.averageITPS);
        const otpsValues = aggregatedData.map(d => d.averageOTPS);
        const counts = aggregatedData.map(d => d.count);
        const tokens = aggregatedData.map(d => d.totalTokens);

        const traceTPS = {
            x: labels,
            y: tpsValues,
            name: 'TPS',
            type: 'bar',
            marker: {
                color: 'rgba(39, 174, 96, 0.7)',
                line: {
                    color: 'rgba(39, 174, 96, 1)',
                    width: 1
                }
            },
            customdata: aggregatedData.map((d, i) => ({
                itps: itpsValues[i],
                otps: otpsValues[i],
                count: counts[i],
                tokens: tokens[i],
                tpsP50: d.tpsPercentiles?.p50,
                tpsP75: d.tpsPercentiles?.p75,
                tpsP95: d.tpsPercentiles?.p95,
                tpsPMax: d.tpsPercentiles?.pMax
            })),
            hovertemplate: (
                '%{x}<br>' +
                'TPS: %{y:.2f}<br>' +
                'TPS p50: %{customdata.tpsP50:.2f}<br>' +
                'TPS p75: %{customdata.tpsP75:.2f}<br>' +
                'TPS p95: %{customdata.tpsP95:.2f}<br>' +
                'TPS pMax: %{customdata.tpsPMax:.2f}<br>' +
                'ITPS: %{customdata.itps:.2f}<br>' +
                'OTPS: %{customdata.otps:.2f}<br>' +
                'Turns: %{customdata.count}<br>' +
                'Tokens: %{customdata.tokens}<br>' +
                '<extra></extra>'
            )
        };

        const traceITPS = {
            x: labels,
            y: itpsValues,
            name: 'ITPS',
            type: 'bar',
            marker: {
                color: 'rgba(52, 152, 219, 0.7)',
                line: {
                    color: 'rgba(52, 152, 219, 1)',
                    width: 1
                }
            },
            customdata: aggregatedData.map(d => ({
                itpsP50: d.itpsPercentiles?.p50,
                itpsP75: d.itpsPercentiles?.p75,
                itpsP95: d.itpsPercentiles?.p95,
                itpsPMax: d.itpsPercentiles?.pMax
            })),
            hovertemplate: (
                '%{x}<br>' +
                'ITPS: %{y:.2f}<br>' +
                'ITPS p50: %{customdata.itpsP50:.2f}<br>' +
                'ITPS p75: %{customdata.itpsP75:.2f}<br>' +
                'ITPS p95: %{customdata.itpsP95:.2f}<br>' +
                'ITPS pMax: %{customdata.itpsPMax:.2f}<br>' +
                '<extra></extra>'
            )
        };

        const traceOTPS = {
            x: labels,
            y: otpsValues,
            name: 'OTPS',
            type: 'bar',
            marker: {
                color: 'rgba(155, 89, 182, 0.7)',
                line: {
                    color: 'rgba(155, 89, 182, 1)',
                    width: 1
                }
            },
            customdata: aggregatedData.map(d => ({
                otpsP50: d.otpsPercentiles?.p50,
                otpsP75: d.otpsPercentiles?.p75,
                otpsP95: d.otpsPercentiles?.p95,
                otpsPMax: d.otpsPercentiles?.pMax
            })),
            hovertemplate: (
                '%{x}<br>' +
                'OTPS: %{y:.2f}<br>' +
                'OTPS p50: %{customdata.otpsP50:.2f}<br>' +
                'OTPS p75: %{customdata.otpsP75:.2f}<br>' +
                'OTPS p95: %{customdata.otpsP95:.2f}<br>' +
                'OTPS pMax: %{customdata.otpsPMax:.2f}<br>' +
                '<extra></extra>'
            )
        };

        const layout = {
            title: {
                text: this.getChartTitle(period),
                font: { size: 18 }
            },
            xaxis: {
                title: {
                    text: this.getXAxisTitle(period)
                }
            },
            yaxis: {
                title: {
                    text: 'Tokens Per Second'
                },
                zeroline: true
            },
            barmode: 'group',
            margin: {
                l: 60,
                r: 20,
                t: 50,
                b: 60
            },
            hovermode: 'closest'
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            displaylogo: false
        };

        Plotly.newPlot(this.chartDiv, [traceTPS, traceITPS, traceOTPS], layout, config);
    }

    getChartTitle(period) {
        const titles = {
            session: 'TPS/ITPS/OTPS Per Session',
            hour: 'TPS/ITPS/OTPS By Hour of Day',
            dayOfWeek: 'TPS/ITPS/OTPS By Day of Week',
            dayOfMonth: 'TPS/ITPS/OTPS By Day of Month',
            month: 'TPS/ITPS/OTPS By Month',
            dateHour: 'TPS/ITPS/OTPS By Date and Hour'
        };
        return titles[period] || 'TPS';
    }

    getXAxisTitle(period) {
        const titles = {
            session: 'Session',
            hour: 'Hour (0-23)',
            dayOfWeek: 'Day',
            dayOfMonth: 'Day of Month',
            month: 'Month',
            dateHour: 'Date & Hour'
        };
        return titles[period] || 'Period';
    }
}
