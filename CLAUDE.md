# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page web application that visualizes Claude Code's tokens per second (TPS) performance from JSONL log files or OpenCode's tokens metrics from SQLite databases. The app runs entirely client-side with vanilla JavaScript, no build step required. Documentation is served via MkDocs.

## Architecture

### Frontend (JavaScript)
Six main modules in `js/`:

- **cacheManager.js** - IndexedDB caching for processed file results (cache key: `filename:size:lastModified`)
- **dataProcessor.js** - Core data pipeline: `parseJSONL()` -> `calculateTPS()` -> `aggregateByPeriod()`/`aggregateByModel()`, plus percentile calculations
- **chartRenderer.js** - Plotly.js chart creation and updates (supports bar, line, scatter types)
- **uiController.js** - UI state management, filters, event handlers, keyboard shortcuts, dark mode, date filtering, chart type switching
- **fileHandler.js** - File upload and directory selection via File System Access API, cache management, detailed progress tracking
- **sqliteHandler.js** - OpenCode SQLite database parsing using sql.js, extracts TPS metrics from opencode.db files

Entry point: `app.js` initializes all modules on DOMContentLoaded.

### Data Flow
#### Claude Code (JSONL Files)
1. User selects directory containing JSONL session files (must match UUID pattern: `[uuid].jsonl`)
2. `processFiles()` checks cache for each file (using cacheManager)
3. For uncached files: parses JSONL, extracts user/assistant message pairs
4. TPS calculated per conversation turn (user timestamp to last assistant timestamp)
5. Processed data cached in IndexedDB for faster reloads
6. Data aggregated by time period (hour/day/dateHour/month) or model
7. Charts render using Plotly, tables via DataTables
8. User can filter by model, date range, and switch chart types
9. Data can be exported to JSON, cache can be cleared

#### OpenCode (SQLite Database)
1. User selects an opencode.db file
2. `sqliteHandler.js` loads sql.js WebAssembly library
3. Database queried for assistant messages with token metrics
4. TPS calculated from input/output tokens and response duration
5. Session IDs come from database's `session_id` column
6. Data transformed to match the standard TPS data format
7. Same aggregation and visualization pipeline as JSONL data

### Key Data Structures
- Input JSONL contains `type: "user"|"assistant"`, `timestamp`, `message.usage`, `sessionId`
- SQLite opencode.db contains `message` table with JSON data including `tokens.input`, `tokens.output`, `time.created`, `time.completed`
- TPS data point: `{timestamp, tps, itps, otps, totalTokens, inputTokens, outputTokens, durationSeconds, model, models[]}`
- Percentiles: `{p50, p75, p95, pMax}` - calculated for TPS, ITPS, OTPS
- Session summary: `{id, turnCount, totalTokens, inputTokens, outputTokens, averageTPS, averageITPS, averageOTPS, timestamp, models[]}`
  - For JSONL: Session ID is filename (UUID)
  - For SQLite: Session ID is in format `opencode-yyyy-mm-dd-hh-mm-ss`

### Keyboard Shortcuts
- `R` - Reload data (return to file selection)
- `E` - Export data to JSON
- `Shift+C` - Clear cache
- `D` - Toggle dark mode
- `H` - Show help modal
- `Esc` - Close modals

## Development Commands

### Web App
No build required. Open `index.html` directly or serve via HTTP server.

### Documentation
```bash
uv run mkdocs build     # Build docs
uv run mkdocs serve     # Serve docs locally at http://localhost:8000
```

### Python
Use `uv` for package management. Python 3.14+ required.
```bash
uv add <package>        # Add dependency
```

## External Dependencies
- **Plotly.js** - Chart visualization (CDN)
- **DataTables.net** - Interactive tables (CDN)
- **jQuery** - DOM manipulation (CDN)
- **sql.js** - SQLite database parsing via WebAssembly (CDN)
- **MkDocs Material** - Documentation theme

## Rules

- Always update the `CLAUDE.md`, `README.md`, `docs/`, and `spec/` files when there are significant changes to the codebase or architecture.
