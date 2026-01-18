# Data Processing

## Overview

The data processing module is responsible for calculating tokens per second (TPS) metrics from parsed message data, aggregating results by various dimensions, and generating summary statistics.

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

* The module MUST support aggregation by the following periods: `session`, `hour`, `dayOfWeek`, `dayOfMonth`, `month`
* The module MUST calculate average TPS, ITPS, and OTPS for each aggregation group
* The module MUST count the number of turns in each aggregation group
* The module MUST sum total tokens for each aggregation group
* The module MUST sort aggregated results appropriately for each period type:
  - `dayOfWeek`: Sunday through Saturday
  - `hour`: 0 through 23
  - `dayOfMonth`: 1 through 31
  - `month`: chronological order
  - `session`: alphanumeric by session ID
* The module MUST support aggregation by model

### File Processing

* The module MUST accept an array of File objects as input
* The module MUST only process files with `.jsonl` extension
* The module MUST only process files whose basename (without extension) matches UUID format
* The module MAY skip files that do not meet the above criteria without error
* The module SHOULD report progress via callback during processing
* The module MUST process files asynchronously to avoid blocking the UI
* The module MUST handle file parsing errors gracefully and continue processing remaining files

### Session Summarization

* The module MUST generate a summary for each session file including:
  - Session ID (filename without extension)
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
  - Total session count
  - Total turn count
  - Total tokens (input + output)
  - Total input tokens
  - Total output tokens
  - Average TPS across all turns
  - Average ITPS across all turns
  - Average OTPS across all turns
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

### Aggregated Period Data

```javascript
{
    label: "Monday" | 0 | 1 | "Jan 2025" | "session-id",
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    count: 125,
    totalTokens: 125000,
    sortKey: 1  // Used for chronological sorting
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
    totalDuration: 11061.7
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
    totalSessions: 10,
    totalTurns: 150,
    totalTokens: 117000,
    totalInputTokens: 55000,
    totalOutputTokens: 62000,
    averageTPS: 45.2,
    averageITPS: 15.1,
    averageOTPS: 30.1,
    models: ["claude-opus-4-5-20250128", "claude-sonnet-4-5-20250128"]
}
```

## Dependencies

* None (vanilla JavaScript)
