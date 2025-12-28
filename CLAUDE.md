# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page web application that visualizes Claude Code's tokens per second (TPS) performance from JSONL log files. The app runs entirely client-side with vanilla JavaScript, no build step required. Documentation is served via MkDocs.

## Architecture

### Frontend (JavaScript)
Four main modules in `js/`:

- **dataProcessor.js** - Core data pipeline: `parseJSONL()` -> `calculateTPS()` -> `aggregateByPeriod()`/`aggregateByModel()`
- **chartRenderer.js** - Plotly.js chart creation and updates
- **uiController.js** - UI state management, filters, event handlers
- **fileHandler.js** - File upload and directory selection via File System Access API

Entry point: `app.js` initializes all modules on DOMContentLoaded.

### Data Flow
1. User selects JSONL files (must match UUID pattern: `[uuid].jsonl`)
2. `processFiles()` parses each file, extracts user/assistant message pairs
3. TPS calculated per conversation turn (user timestamp to last assistant timestamp)
4. Data aggregated by time period (hour/day/month) or model
5. Charts render using Plotly, tables via DataTables

### Key Data Structures
- Input JSONL contains `type: "user"|"assistant"`, `timestamp`, `message.usage`, `sessionId`
- TPS data point: `{timestamp, tps, totalTokens, durationSeconds, model}`
- Session summary: `{id, turnCount, totalTokens, averageTPS, models[]}`

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
