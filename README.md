# Tokens Per Second Viewer

A web-based viewer for visualizing Claude Code and OpenCode session performance metrics. Analyze tokens per second (TPS), usage patterns, and model statistics from your AI sessions.

## Features

- **Multiple Data Sources**: Load data from:
  - **Claude Code JSONL Files**: Select a directory containing Claude Code session files (JSONL format) using modern File System Access API
  - **OpenCode SQLite Database**: Load directly from opencode.db files
- **Performance Metrics**:
  - Total sessions and turns analyzed
  - Average TPS, ITPS (input TPS), and OTPS (output TPS)
  - TPS, ITPS, and OTPS percentiles (p50, p75, p95, pMax)
  - Total input, output, and combined tokens
- **Time-Based Analysis**: Charts showing TPS/ITPS/OTPS by:
  - Per-session breakdown
  - By hour of day
  - By date
  - By date & hour
  - By day of week
  - By day of month
  - By month
- **Chart Types**: Switch between bar, line, and scatter visualizations
- **Model Statistics**: Per-model breakdowns including:
  - Average TPS/ITPS/OTPS with percentiles
  - Turn counts
  - Token usage (input/output/total)
  - Total duration
- **Filtering**: Filter charts and sessions table by model and date range
- **Sortable Data Table**: DataTables-powered table with columns for session ID, date & time, turns, tokens, TPS metrics, and models
- **Progress Indicator**: Real-time progress bar during file processing with:
  - Current file being processed
  - Cache hit count
  - Processing time and estimated remaining
  - Cache hit rate percentage
- **Caching**: IndexedDB-based caching for faster reprocessing of unchanged files
- **Data Export**: Export processed data to JSON for external analysis
- **Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **Keyboard Shortcuts**: Quick access to common functions:
  - `R` - Reload data
  - `E` - Export data
  - `C` - Clear cache
  - `D` - Toggle dark mode
  - `H` - Show help
  - `Esc` - Close modals
- **Accessibility**: ARIA labels and improved keyboard navigation for screen readers
- **Help System**: Built-in documentation explaining TPS metrics and percentiles

## Usage

### Local Use

Simply open `index.html` in a web browser. No build process required.

1. Open `index.html` in your web browser
2. Choose your data source:
   - **For Claude Code**: Click "Select JSONL Directory" and navigate to your Claude Code sessions directory
   - **For OpenCode**: Click "Select opencode.db" and select your database file
3. View the generated dashboard

**Note**: Directory selection uses File System Access API in Chrome/Edge. Other browsers fall back to a traditional file picker.

### Session File Formats

#### Claude Code (JSONL)

The viewer processes JSONL files from Claude Code sessions. Each file should:
- Be named with a UUID (e.g., `19256c5c-e14f-4e2e-89be-ebc942ffe212.jsonl`)
- Contain JSON lines with `type: "user"` or `type: "assistant"` messages
- Include `timestamp`, `usage` (with `input_tokens`/`output_tokens`), and `model` fields

Example JSONL entry:
```json
{
  "type": "assistant",
  "timestamp": "2025-12-28T02:52:27.688Z",
  "message": {
    "role": "assistant",
    "model": "glm-4.5-air",
    "usage": {
      "input_tokens": 1109,
      "output_tokens": 61
    }
  }
}
```

#### OpenCode (SQLite)

The viewer can also load data directly from OpenCode's `opencode.db` SQLite database file. The database must contain a `message` table with:

- A `data` column containing JSON objects with:
  - `role`: "assistant"
  - `tokens.input`: Input token count
  - `tokens.output`: Output token count
  - `time.created`: Creation timestamp (milliseconds)
  - `time.completed`: Completion timestamp (milliseconds)
  - `modelID`: Model identifier

Session IDs come from the database's `session_id` column.

## Development

This is a static site with vanilla JavaScript. Key files:

- `index.html` - Main page structure
- `app.js` - Application initialization
- `js/cacheManager.js` - IndexedDB caching for processed files
- `js/dataProcessor.js` - JSONL parsing and TPS/ITPS/OTPS calculation with percentiles
- `js/fileHandler.js` - File System Access API handling with fallback
- `js/sqliteHandler.js` - SQLite database parsing using sql.js
- `js/chartRenderer.js` - Plotly grouped bar chart rendering (TPS/ITPS/OTPS with percentiles)
- `js/uiController.js` - UI state management, DataTables initialization
- `styles.css` - Styling

### Dependencies (CDN)

- jQuery 3.7.1
- Plotly.js 3.3.0
- DataTables 2.3.6
- DataTables ColumnControl 1.2.0
- sql.js 1.12.0 (SQLite parsing via WebAssembly)

## License

MIT
