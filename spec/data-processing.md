# Data Processing

## Overview

The data processing module is responsible for calculating tokens per second (TPS) metrics from parsed message data, aggregating results by various dimensions, computing percentile distributions, and generating summary statistics. It also supports caching via IndexedDB for faster reprocessing.

## Requirements

### TPS Calculation

* The module MUST group messages into conversation turns (user message followed by one or more assistant messages)
* The module MUST calculate turn duration from user timestamp to the last assistant timestamp
* The module MUST calculate total tokens as the sum of all input and output tokens in a turn
* The module MUST calculate TPS as total tokens divided by duration in seconds
* The module MUST calculate ITPS (input TPS) as input tokens divided by duration in seconds
* The module MUST calculate OTPS (output TPS) as output tokens divided by duration in seconds
* The module MUST reject turns with zero or negative duration
* The module MUST identify the model(s) used in each turn
* The module MUST associate all TPS data points with a session ID

### Aggregation

* The module MUST support aggregation by the following periods: `session`, `hour`, `day`, `dateHour`, `dayOfWeek`, `dayOfMonth`, `month`
* The module MUST calculate average TPS, ITPS, and OTPS for each aggregation group
* The module MUST count the number of turns in each aggregation group
* The module MUST sum total tokens for each aggregation group
* The module MUST calculate percentile distributions (p50, p75, p95, pMax) for TPS/ITPS/OTPS within each group
* The module MUST sort aggregated results appropriately for each period type:
  - `dayOfWeek`: Sunday through Saturday
  - `hour`: 0 through 23
  - `dayOfMonth`: 1 through 31
  - `day`: chronological order (YYYY-MM-DD format for string sorting)
  - `dateHour`: chronological order (YYYY-MM-DD HH:00 format)
  - `month`: chronological order
  - `session`: alphanumeric by session ID
* The module MUST support aggregation by model with percentile distributions

### Percentile Calculation

* The module MUST calculate percentiles from an array of numeric values
* The module MUST support the following percentiles: p50, p75, p95, pMax
* The module MUST use the method: index = ceil((percentile / 100) × array_length) - 1
* The module MUST return zeros for all percentiles if the input array is empty
* p50 represents the median value
* p75 represents the 75th percentile
* p95 represents the 95th percentile
* pMax represents the maximum value

### File Processing

* The module MUST accept an array of File objects as input
* The module MUST accept an optional CacheManager instance for caching
* The module MUST only process files with `.jsonl` extension
* The module MUST only process files whose basename (without extension) matches UUID format
* The module MAY skip files that do not meet the above criteria without error
* The module SHOULD report progress via callback during processing
* The module MUST process files asynchronously to avoid blocking the UI
* The module MUST handle file parsing errors gracefully and continue processing remaining files
* The module MUST check cache before processing each file
* The module MUST use cache key format: `filename:size:lastModified`
* The module MUST store processed results in cache if cache is available
* The module MUST report number of files processed, files from cache, and files skipped

### Session Summarization

* The module MUST generate a summary for each session file including:
  - Session ID (filename without extension)
  - Filename
  - Turn count
  - Total tokens (input + output)
  - Input tokens
  - Output tokens
  - Average TPS
  - Average ITPS
  - Average OTPS
  - Timestamp of first message
  - List of models used

### Global Summary

* The module MUST generate a global summary including:
  - Files scanned
  - Files processed
  - Files skipped
  - Files from cache
  - Total session count
  - Total turn count
  - Total tokens (input + output)
  - Total input tokens
  - Total output tokens
  - Average TPS across all turns
  - Average ITPS across all turns
  - Average OTPS across all turns
  - TPS percentiles (p50, p75, p95, pMax)
  - ITPS percentiles (p50, p75, p95, pMax)
  - OTPS percentiles (p50, p75, p95, pMax)
  - List of unique models

## Data Structures

### TPS Data Point

```javascript
{
    sessionId: "19256c5c-e14f-4e2e-89be-ebc942ffe212",
    timestamp: Date("2025-12-28T02:52:27.688Z"),
    tps: 45.2,
    itps: 15.1,
    otps: 30.1,
    totalTokens: 1170,
    inputTokens: 1109,
    outputTokens: 61,
    durationSeconds: 25.9,
    model: "claude-opus-4-5-20250128",
    models: ["claude-opus-4-5-20250128"]
}
```

### Percentiles

```javascript
{
    p50: 42.5,
    p75: 55.3,
    p95: 78.9,
    pMax: 120.0
}
```

### Aggregated Period Data

```javascript
{
    label: "Monday" | 0 | 1 | "2025-01-15" | "2025-01-15 14:00" | "session-id",
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    count: 125,
    totalTokens: 125000,
    sortKey: 1,  // Used for chronological sorting
    tpsPercentiles: {p50: 40.0, p75: 52.0, p95: 75.0, pMax: 110.0},
    itpsPercentiles: {p50: 14.0, p75: 18.0, p95: 25.0, pMax: 40.0},
    otpsPercentiles: {p50: 26.0, p75: 34.0, p95: 50.0, pMax: 70.0}
}
```

### Model Statistics

```javascript
{
    model: "claude-opus-4-5-20250128",
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    turnCount: 500,
    totalTokens: 500000,
    totalInputTokens: 250000,
    totalOutputTokens: 250000,
    totalDuration: 11061.7,
    tpsPercentiles: {p50: 40.0, p75: 52.0, p95: 75.0, pMax: 110.0},
    itpsPercentiles: {p50: 14.0, p75: 18.0, p95: 25.0, pMax: 40.0},
    otpsPercentiles: {p50: 26.0, p75: 34.0, p95: 50.0, pMax: 70.0}
}
```

### Session Summary

```javascript
{
    id: "19256c5c-e14f-4e2e-89be-ebc942ffe212",
    filename: "19256c5c-e14f-4e2e-89be-ebc942ffe212.jsonl",
    turnCount: 15,
    totalTokens: 11700,
    inputTokens: 5500,
    outputTokens: 6200,
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    timestamp: Date("2025-12-28T02:52:27.688Z"),
    models: ["claude-opus-4-5-20250128", "claude-sonnet-4-5-20250128"]
}
```

### Global Summary

```javascript
{
    filesScanned: 100,
    filesProcessed: 95,
    filesSkipped: 3,
    filesFromCache: 20,
    totalSessions: 95,
    totalTurns: 1500,
    totalTokens: 1170000,
    totalInputTokens: 550000,
    totalOutputTokens: 620000,
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    tpsPercentiles: {p50: 40.0, p75: 52.0, p95: 75.0, pMax: 110.0},
    itpsPercentiles: {p50: 14.0, p75: 18.0, p95: 25.0, pMax: 40.0},
    otpsPercentiles: {p50: 26.0, p75: 34.0, p95: 50.0, pMax: 70.0},
    models: ["claude-opus-4-5-20250128", "claude-sonnet-4-5-20250128"]
}
```

### Cache Entry

```javascript
{
    fileKey: "session.jsonl:12345:1704067200000",
    filename: "session.jsonl",
    processedAt: 1704067200000,
    data: {
        tpsData: [...],  // Array of TPS data points
        session: {...}   // Session summary object
    }
}
```

## Dependencies

* None (vanilla JavaScript)
* Optional: CacheManager for IndexedDB caching
