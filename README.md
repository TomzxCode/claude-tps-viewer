# Claude TPS Viewer

A web-based viewer for visualizing Claude Code session performance metrics. Analyze tokens per second (TPS), usage patterns, and model statistics from your Claude Code sessions.

## Features

- **Directory Selection**: Select a directory containing Claude Code session files (JSONL format) using the modern File System Access API (with fallback for other browsers)
- **Performance Metrics**:
  - Total sessions and turns analyzed
  - Average TPS, ITPS (input TPS), and OTPS (output TPS)
  - Total input, output, and combined tokens
- **Time-Based Analysis**: Grouped bar charts showing TPS/ITPS/OTPS by:
  - Per-session breakdown
  - By hour of day
  - By day of week
  - By day of month
  - By month
- **Model Statistics**: Per-model breakdowns including:
  - Average TPS/ITPS/OTPS
  - Turn counts
  - Token usage (input/output/total)
  - Total duration
- **Filtering**: Filter both charts and sessions table by model
- **Sortable Data Table**: DataTables-powered table with columns for session ID, date, turns, tokens, TPS metrics, and models
- **Progress Indicator**: Real-time progress bar during file processing

## Usage

### Local Use

Simply open `index.html` in a web browser. No build process required.

1. Open the page in your browser
2. Click "Select Directory"
3. Navigate to your Claude Code sessions directory
4. View the generated dashboard

**Note**: Uses the File System Access API in Chrome/Edge. Other browsers fall back to a traditional file picker.

### Session File Format

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

## Development

This is a static site with vanilla JavaScript. Key files:

- `index.html` - Main page structure
- `app.js` - Application initialization
- `js/dataProcessor.js` - JSONL parsing and TPS/ITPS/OTPS calculation
- `js/fileHandler.js` - File System Access API handling with fallback
- `js/chartRenderer.js` - Plotly grouped bar chart rendering (TPS/ITPS/OTPS)
- `js/uiController.js` - UI state management, DataTables initialization
- `styles.css` - Styling

### Dependencies (CDN)

- jQuery 3.7.1
- Plotly.js 3.3.0
- DataTables 2.3.6
- DataTables ColumnControl 1.2.0

## License

MIT
