# Claude TPS Viewer

A web-based viewer for visualizing Claude Code session performance metrics. Analyze tokens per second (TPS), usage patterns, and model statistics from your Claude Code sessions.

## Overview

Claude TPS Viewer is a single-page web application that runs entirely in your browser. It processes Claude Code session logs (JSONL format) and generates interactive visualizations of:

- **Tokens per second (TPS)** - Overall processing speed
- **Input TPS (ITPS)** - Input token processing speed
- **Output TPS (OTPS)** - Output token generation speed

## Features

- **Directory Selection** - Select a folder containing Claude Code session files
- **Time-Based Analysis** - View performance by hour, day of week, day of month, or month
- **Model Statistics** - Compare performance across different Claude models
- **Interactive Charts** - Plotly-powered visualizations
- **Sortable Tables** - Filter sessions by model and sort by various metrics
- **No Backend Required** - All processing happens client-side

## Quick Start

1. Open `index.html` in a web browser
2. Click **Select Directory**
3. Navigate to your Claude Code sessions directory
4. View the generated dashboard

## Session File Format

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
    "model": "claude-opus-4-5-20250128",
    "usage": {
      "input_tokens": 1109,
      "output_tokens": 61
    }
  }
}
```

## License

MIT
