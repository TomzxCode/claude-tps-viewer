# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page web application that visualizes Claude Code's tokens per second (TPS) performance from JSONL log files. The app runs entirely client-side with vanilla JavaScript, no build step required. Documentation is served via MkDocs.

## Architecture

### Frontend (JavaScript)
Five main modules in `js/`:

- **cacheManager.js** - IndexedDB caching for processed file results (cache key: `filename:size:lastModified`)
- **dataProcessor.js** - Core data pipeline: `parseJSONL()` -> `calculateTPS()` -> `aggregateByPeriod()`/`aggregateByModel()`, plus percentile calculations
- **chartRenderer.js** - Plotly.js chart creation and updates
- **uiController.js** - UI state management, filters, event handlers
- **fileHandler.js** - File upload and directory selection via File System Access API

Entry point: `app.js` initializes all modules on DOMContentLoaded.

### Data Flow
1. User selects JSONL files (must match UUID pattern: `[uuid].jsonl`)
2. `processFiles()` checks cache for each file (using cacheManager)
3. For uncached files: parses JSONL, extracts user/assistant message pairs
4. TPS calculated per conversation turn (user timestamp to last assistant timestamp)
5. Processed data cached in IndexedDB for faster reloads
6. Data aggregated by time period (hour/day/dateHour/month) or model
7. Charts render using Plotly, tables via DataTables

### Key Data Structures
- Input JSONL contains `type: "user"|"assistant"`, `timestamp`, `message.usage`, `sessionId`
- TPS data point: `{timestamp, tps, itps, otps, totalTokens, inputTokens, outputTokens, durationSeconds, model, models[]}`
- Percentiles: `{p50, p75, p95, pMax}` - calculated for TPS, ITPS, OTPS
- Session summary: `{id, turnCount, totalTokens, inputTokens, outputTokens, averageTPS, averageITPS, averageOTPS, timestamp, models[]}`

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
- **MkDocs Material** - Documentation theme

## Rules

- Always update the `CLAUDE.md`, `README.md`, `docs/`, and `spec/` files when there are significant changes to the codebase or architecture.
