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
| Average TPS | Mean tokens per second across all turns |
| Average ITPS | Mean input tokens per second |
| Average OTPS | Mean output tokens per second |
| Total Input Tokens | Sum of all input tokens |
| Total Output Tokens | Sum of all output tokens |
| Total Tokens | Combined token count |

### Time Period Tabs

Switch between different time aggregations:

- **Per Session** - Individual session performance
- **By Hour** - Performance by hour of day (0-23)
- **By Day of Week** - Performance by weekday
- **By Day of Month** - Performance by calendar day (1-31)
- **By Month** - Performance by month/year

### Model Filter

Filter charts and tables by specific Claude models using the dropdown selector.

### Charts

The main chart displays TPS metrics over the selected time period:

- **Blue bars** - Total TPS
- **Red line** - Input TPS
- **Green line** - Output TPS

Hover over data points for detailed information.

### Model Statistics

Compare performance across different models:

- Average TPS/ITPS/OTPS per model
- Turn count per model
- Total tokens processed per model

### Sessions Table

Sortable, filterable table with per-session details:

- Session ID (click to copy)
- Date/time
- Number of turns
- Token counts (input/output/total)
- Average TPS/ITPS/OTPS
- Models used

## Understanding TPS Calculations

### Per-Turn Calculation

For each conversation turn (user message → assistant responses):

```
Duration = Last assistant timestamp - User timestamp
Total Tokens = Sum of all tokens in assistant responses
TPS = Total Tokens / Duration
```

### Aggregation

Time-based aggregations compute the mean TPS across all turns within the period.

## Browser Compatibility

Tested on modern browsers with ES6+ support:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires the File System Access API for directory selection.
