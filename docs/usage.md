# Usage Guide

## Getting Started

Claude TPS Viewer requires no installation or build process. Simply open `index.html` in a modern web browser.

## Loading Session Data

### Step 1: Select Directory

Click the **Select Directory** button to open the directory picker. Navigate to the folder containing your Claude Code session files.

### Step 2: File Detection

The viewer automatically detects and processes valid session files. Files must:

1. Have a `.jsonl` extension
2. Be named with a UUID pattern (e.g., `12345678-1234-1234-1234-123456789abc.jsonl`)

### Step 3: View Dashboard

Once processed, the dashboard displays with:

- Summary cards showing overall statistics
- Time-based TPS charts
- Model comparison statistics
- Detailed session table

## Dashboard Elements

### Summary Cards

| Metric | Description |
|--------|-------------|
| Total Sessions | Number of session files processed |
| TPS Percentiles | p50, p75, p95, pMax for overall TPS |
| ITPS Percentiles | p50, p75, p95, pMax for input TPS |
| OTPS Percentiles | p50, p75, p95, pMax for output TPS |
| Total Input Tokens | Sum of all input tokens |
| Total Output Tokens | Sum of all output tokens |
| Total Tokens | Combined token count |

### Time Period Tabs

Switch between different time aggregations:

- **Per Session** - Individual session performance
- **By Hour** - Performance by hour of day (0-23)
- **By Date** - Performance by calendar date
- **By Date & Hour** - Performance by date and hour combined
- **By Day of Week** - Performance by weekday
- **By Day of Month** - Performance by calendar day (1-31)
- **By Month** - Performance by month/year

### Model Filter

Filter charts and tables by specific Claude models using the dropdown selector.

### Charts

The main chart displays grouped bar charts for TPS metrics over the selected time period:

- **Green bars** - Total TPS
- **Blue bars** - Input TPS (ITPS)
- **Purple bars** - Output TPS (OTPS)

Hover over data points for detailed information including percentiles.

### Model Statistics

Compare performance across different models:

- Average TPS/ITPS/OTPS per model
- Percentiles (p50/p75/p95/pMax) for each metric
- Turn count per model
- Total tokens processed per model

### Sessions Table

Sortable, filterable table with per-session details:

- Session ID (displayed as code element)
- Date & Time (format: YYYY-MM-DD HH:MM:SS)
- Number of turns
- Token counts (input/output/total)
- Average TPS/ITPS/OTPS
- Models used

## Understanding TPS Calculations

### Per-Turn Calculation

For each conversation turn (user message → assistant responses):

```
Duration = Last assistant timestamp - User timestamp
Input Tokens = Sum of input_tokens in assistant responses
Output Tokens = Sum of output_tokens in assistant responses
TPS = (Input Tokens + Output Tokens) / Duration
ITPS = Input Tokens / Duration
OTPS = Output Tokens / Duration
```

### Percentiles

Percentiles are calculated from all turn TPS values:

- **p50** - Median (50th percentile)
- **p75** - 75th percentile
- **p95** - 95th percentile
- **pMax** - Maximum value

### Aggregation

Time-based aggregations compute the mean TPS across all turns within the period, along with percentile distributions.

## Caching

The viewer uses IndexedDB to cache processed file results. Cache entries are keyed by `filename:size:lastModified`, so:

- Reloading the same directory is nearly instant
- Modified files are automatically reprocessed
- Cache persists across browser sessions

## Browser Compatibility

Tested on modern browsers with ES6+ support:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

The File System Access API is used for directory selection in supported browsers. Other browsers fall back to traditional file input.
