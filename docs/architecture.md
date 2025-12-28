# Architecture

## Overview

Claude TPS Viewer is a client-side only application built with vanilla JavaScript. No build process, server, or API keys required.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Charts**: Plotly.js (CDN)
- **Tables**: DataTables.net (CDN)
- **DOM**: jQuery (CDN)
- **Styling**: Custom CSS
- **Docs**: MkDocs with Material theme

## Module Structure

```
js/
├── dataProcessor.js   # Data parsing and TPS calculation
├── fileHandler.js     # File input and directory selection
├── chartRenderer.js   # Plotly chart creation
└── uiController.js    # UI state and event handling

app.js                 # Application entry point
index.html             # Main HTML structure
styles.css             # Styling
```

## Data Flow

```
┌─────────────────┐
│  File Selection │
│  (user action)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  fileHandler.js │
│  - Read files   │
│  - Filter .jsonl│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│dataProcessor.js │
│  - Parse JSONL  │
│  - CalculateTPS │
│  - Aggregate    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│uiController.js  │
│  - Update state │
│  - Populate UI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│chartRenderer.js │
│  - Create plots │
│  - Create table │
└─────────────────┘
```

## Core Modules

### dataProcessor.js

The data pipeline engine.

**Functions:**

| Function | Purpose |
|----------|---------|
| `parseJSONL(content)` | Parse JSONL content into message objects |
| `calculateTPS(messages, sessionId)` | Compute TPS for each conversation turn |
| `calculateTurnTPS(turn, sessionId)` | Calculate TPS for a single turn |
| `aggregateByPeriod(tpsData, period)` | Aggregate by time period |
| `aggregateByModel(tpsData)` | Aggregate by model |
| `processFiles(files, onProgress)` | Main entry point for file processing |

**Data Structures:**

```javascript
// TPS data point
{
    sessionId: string,
    timestamp: Date,
    tps: number,           // Total tokens per second
    itps: number,          // Input tokens per second
    otps: number,          // Output tokens per second
    totalTokens: number,
    inputTokens: number,
    outputTokens: number,
    durationSeconds: number,
    model: string,
    models: string[]
}
```

### fileHandler.js

Handles file input via File System Access API.

**Functions:**

| Function | Purpose |
|----------|---------|
| `handleDirectorySelect()` | Trigger directory picker |
| `processSelectedFiles(files)` | Validate and process files |

### chartRenderer.js

Creates Plotly charts and DataTables.

**Functions:**

| Function | Purpose |
|----------|---------|
| `renderChart(tpsData, period, selectedModel)` | Create/update main chart |
| `renderModelStats(modelStats)` | Create model comparison cards |
| `renderSessionsTable(sessions)` | Create sortable session table |

### uiController.js

Manages UI state and event listeners.

**Functions:**

| Function | Purpose |
|----------|---------|
| `initializeUI()` | Set up event listeners |
| `updateSummary(summary)` | Update summary cards |
| `updateModelFilter(models)` | Populate model dropdowns |
| `showError(message)` | Display error modal |
| `updateStatus(text, progress)` | Update progress bar |

## Key Design Decisions

### Client-Side Only

- No server required - user data stays local
- No API keys or authentication
- Simple deployment (static hosting)

### Vanilla JavaScript

- No build step required
- Easy to debug and modify
- Minimal dependencies

### File System Access API

- Modern browser feature for directory selection
- Better UX than individual file selection
- Fallback not implemented (requires modern browser)

## TPS Calculation Details

### Conversation Turn Definition

A "turn" spans from a user message to the last assistant message in the response sequence.

```
User message (timestamp: T1)
  ↓
Assistant chunk 1 (timestamp: T2)
Assistant chunk 2 (timestamp: T3)
  ...
Assistant chunk N (timestamp: T4)

Turn duration = T4 - T1
```

### Aggregation Strategy

- **Time periods**: Mean of all turn TPS values within the period
- **Models**: Mean of all turn TPS values for that model
- **Sessions**: Mean of all turn TPS values within the session
