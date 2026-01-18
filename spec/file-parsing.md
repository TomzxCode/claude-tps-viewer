# File Parsing

## Overview

The file parsing module is responsible for reading and parsing JSONL (JSON Lines) files containing Claude Code session logs. This module transforms raw log data into structured message objects for further processing.

## Requirements

### Input Format

* The parser MUST accept raw JSONL file content as a string input
* The parser MUST split content by newline characters to process individual JSON objects
* The parser MUST only process messages with `type` field equal to `"user"` or `"assistant"`
* The parser SHOULD skip lines that cannot be parsed as valid JSON
* The parser MAY log warnings for unparseable lines to aid debugging

### Message Extraction

* The parser MUST extract the `type` field from each JSON line
* The parser MUST extract the `timestamp` field and convert it to a JavaScript Date object
* The parser MUST extract the `usage` object from nested `message.usage` path
* The parser MUST extract the `role` field from nested `message.role` path
* The parser MUST extract the `sessionId` field
* The parser MUST extract the `uuid` field
* The parser MUST extract the `model` field from nested `message.model` path
* The parser MUST default `usage` to `null` if not present in the message
* The parser MUST default `role` to `null` if not present in the message
* The parser MUST default `model` to `null` if not present in the message

### Output Structure

* The parser MUST return an array of message objects
* Each message object MUST contain: `type`, `timestamp`, `usage`, `role`, `sessionId`, `uuid`, `model`

### Error Handling

* The parser MUST NOT throw exceptions for unparseable lines
* The parser MUST continue processing remaining lines after encountering an invalid line
* The parser MAY output warnings to console for debugging purposes

## Data Structures

### Input JSONL Format

```json
{"type": "user", "timestamp": "2025-12-28T02:52:27.688Z", "sessionId": "abc123", "uuid": "xyz789"}
{"type": "assistant", "timestamp": "2025-12-28T02:52:28.688Z", "message": {"role": "assistant", "model": "claude-opus-4-5-20250128", "usage": {"input_tokens": 1109, "output_tokens": 61}}}
```

### Parsed Message Object

```javascript
{
    type: "assistant",
    timestamp: Date("2025-12-28T02:52:28.688Z"),
    usage: { input_tokens: 1109, output_tokens: 61 },
    role: "assistant",
    sessionId: "abc123",
    uuid: "xyz789",
    model: "claude-opus-4-5-20250128"
}
```

## Dependencies

* None (vanilla JavaScript)
