# Tokens Per Second Viewer

A web-based viewer for visualizing Claude Code and OpenCode session performance metrics. Analyze tokens per second (TPS), usage patterns, and model statistics from your AI sessions.

## Overview

Tokens Per Second Viewer is a single-page web application that runs entirely in your browser. It processes:

- **Claude Code** session logs (JSONL format)
- **OpenCode** SQLite databases (opencode.db)

The viewer generates interactive visualizations of:

- **Tokens per second (TPS)** - Overall processing speed
- **Input TPS (ITPS)** - Input token processing speed
- **Output TPS (OTPS)** - Output token generation speed

## Features

- **Directory Selection** - Select a folder containing Claude Code session files (JSONL format) using modern File System Access API
- **SQLite Database** - Load directly from opencode.db file (OpenCode SQLite database)
- **Time-Based Analysis** - View performance by hour, date, date & hour, day of week, day of month, or month
- **Percentile Metrics** - See p50, p75, p95, and pMax for TPS/ITPS/OTPS across all data
- **Model Statistics** - Compare performance across different models with per-model percentiles
- **Interactive Charts** - Plotly-powered visualizations with percentile hover info
- **Sortable Tables** - Filter sessions by model and sort by various metrics
- **IndexedDB Caching** - Faster reloads for previously processed files
- **No Backend Required** - All processing happens client-side

## Quick Start

1. Open `index.html` in a web browser
2. Choose your data source:
   - **For Claude Code**: Click **Select JSONL Directory** and navigate to your Claude Code sessions directory
   - **For OpenCode**: Click **Select opencode.db** and select your database file
3. View the generated dashboard

## Session File Formats

### Claude Code (JSONL)

The viewer processes JSONL files from Claude Code sessions. Each file should:

- Be named with a UUID (e.g., `19256c5c-e14f-4e2e-89be-ebc942ffe212.jsonl`)
- Contain JSON lines with `type: "user"` or `type: "assistant"` messages
- Include `timestamp`, `usage` (with `input_tokens`/`output_tokens`), and `model` fields

### Example JSONL Entry

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

### SQLite Database

The viewer can also load data directly from OpenCode's `opencode.db` SQLite database file. The database must contain a `message` table with:

- A `data` column containing JSON objects with:
  - `role`: "assistant"
  - `tokens.input`: Input token count
  - `tokens.output`: Output token count
  - `time.created`: Creation timestamp (milliseconds)
  - `time.completed`: Completion timestamp (milliseconds)
  - `modelID`: Model identifier
  - `session_id`: Session identifier from OpenCode

Session IDs are taken directly from the database's `session_id` column.

## License

MIT
