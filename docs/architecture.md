# Architecture

## Overview

Claude TPS Viewer is a client-side only application built with vanilla JavaScript. No build process, server, or API keys required.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Charts**: Plotly.js (CDN)
- **Tables**: DataTables.net (CDN)
- **DOM**: jQuery (CDN)
- **Caching**: IndexedDB (browser native)
- **Styling**: Custom CSS
- **Docs**: MkDocs with Material theme

## Module Structure

```
js/
├── cacheManager.js    # IndexedDB caching for processed files
├── dataProcessor.js   # Data parsing and TPS calculation with percentiles
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
┌─────────────────┐     ┌─────────────────┐
│ cacheManager.js │────▶│  IndexedDB      │
│  - Check cache  │     │  (TPSViewerCache)│
└────────┬────────┘     └─────────────────┘
         │                    ▲
         │ Cache miss         │ Cache hit
         ▼                    │
┌─────────────────┐            │
│dataProcessor.js │◀───────────┘
│  - Parse JSONL  │
│  - CalculateTPS │
│  - Aggregate    │
│  - Percentiles  │
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

### cacheManager.js

IndexedDB wrapper for caching processed file results.

**Class:** `CacheManager`

**Methods:**

| Method | Purpose |
|--------|---------|
| `init()` | Initialize IndexedDB database |
| `get(fileKey)` | Retrieve cached data for a file key |
| `set(fileKey, filename, data)` | Store processed data |
| `clear()` | Clear all cached data |
| `getStats()` | Get cache statistics |

**Cache Key Format:** `filename:size:lastModified`

**Database:** `TPSViewerCache` with `processedFiles` object store.

### dataProcessor.js

The data pipeline engine.

**Functions:**

| Function | Purpose |
|----------|---------|
| `parseJSONL(content)` | Parse JSONL content into message objects |
| `calculateTPS(messages, sessionId)` | Compute TPS/ITPS/OTPS for each conversation turn |
| `calculateTurnTPS(turn, sessionId)` | Calculate TPS for a single turn |
| `calculatePercentiles(values)` | Compute p50, p75, p95, pMax from values |
| `aggregateByPeriod(tpsData, period)` | Aggregate by time period with percentiles |
| `aggregateByModel(tpsData)` | Aggregate by model with percentiles |
| `processFiles(files, onProgress, cacheManager)` | Main entry point with caching support |

**Supported Periods:** `session`, `hour`, `day`, `dateHour`, `dayOfWeek`, `dayOfMonth`, `month`

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

// Percentiles
{
    p50: number,  // Median
    p75: number,  // 75th percentile
    p95: number,  // 95th percentile
    pMax: number  // Maximum value
}

// Aggregated data with percentiles
{
    label: string,
    averageTPS: number,
    averageITPS: number,
    averageOTPS: number,
    count: number,
    totalTokens: number,
    tpsPercentiles: {p50, p75, p95, pMax},
    itpsPercentiles: {p50, p75, p95, pMax},
    otpsPercentiles: {p50, p75, p95, pMax}
}
```

### fileHandler.js

Handles file input via File System Access API.

**Class:** `FileHandler`

**Methods:**

| Method | Purpose |
|----------|---------|
| `selectDirectory()` | Trigger directory picker |
| `readDirectory(dirHandle)` | Recursively scan for .jsonl files |
| `processFiles(files)` | Process files with caching |

### chartRenderer.js

Creates Plotly charts and DataTables.

**Class:** `ChartRenderer`

**Methods:**

| Method | Purpose |
|----------|---------|
| `renderChart(data, period)` | Create/update main chart with percentiles in hover |

### uiController.js

Manages UI state and event listeners.

**Class:** `UIController`

**Methods:**

| Method | Purpose |
|----------|---------|
| `showDashboard()` | Display dashboard with data |
| `updatePercentileCards()` | Update percentile summary cards |
| `renderModelStats()` | Render model statistics with percentiles |
| `renderSessionsTable()` | Create sortable session table |

## Key Design Decisions

### Client-Side Only

- No server required - user data stays local
- No API keys or authentication
- Simple deployment (static hosting)

### Vanilla JavaScript

- No build step required
- Easy to debug and modify
- Minimal dependencies

### IndexedDB Caching

- Persistent cache across browser sessions
- Cache key based on file identity (name + size + modified time)
- Automatic cache invalidation for changed files
- Dramatically speeds up reprocessing

### Percentile Metrics

- Provides distribution insights beyond averages
- Calculated at turn level, aggregated to periods
- Displayed in summary cards, model stats, and chart hover

### File System Access API

- Modern browser feature for directory selection
- Better UX than individual file selection
- Fallback to traditional file input for unsupported browsers

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
Input TPS = Sum(input_tokens) / duration
Output TPS = Sum(output_tokens) / duration
Total TPS = (Input + Output) / duration
```

### Percentile Calculation

Percentiles are computed from the sorted array of values:

- **p50**: Value at index ceil(0.5 × n) - 1
- **p75**: Value at index ceil(0.75 × n) - 1
- **p95**: Value at index ceil(0.95 × n) - 1
- **pMax**: Maximum value

### Aggregation Strategy

- **Time periods**: Mean of all turn TPS values within the period + percentile distribution
- **Models**: Mean of all turn TPS values for that model + percentile distribution
- **Sessions**: Mean of all turn TPS values within the session
