# File Selection

## Overview

The file selection module is responsible for allowing users to select directories or files containing Claude Code session logs, using the File System Access API when available or falling back to traditional file input.

## Requirements

### Directory Selection

* The module MUST attempt to use the File System Access API (`window.showDirectoryPicker`) when available
* The module MUST fall back to traditional file input when File System Access API is not available
* The module MUST handle user cancellation gracefully without showing errors
* The module MAY show an error message for non-cancellation errors

### Directory Scanning

* When using File System Access API, the module MUST recursively scan the selected directory for `.jsonl` files
* The module MUST scan subdirectories recursively
* The module MUST collect all `.jsonl` files into an array for processing
* The module MUST display an error if no `.jsonl` files are found

### Fallback File Input

* The module MUST provide a hidden file input element as fallback for browsers without File System Access API
* The module MUST trigger the file input dialog when File System Access API is unavailable
* The module MUST filter selected files to only include `.jsonl` files
* The module MUST display an error if no `.jsonl` files are selected

### Progress Indication

* The module MUST display a status bar during file processing
* The module MUST show the number of files processed (e.g., "Processing 5/10 files...")
* The module MUST display a visual progress indicator (percentage bar)
* The module MUST hide the status bar when processing completes

### Error Handling

* The module MUST display a modal dialog for error messages
* The module MUST provide a close button for the error modal
* The module MUST NOT interrupt the user workflow for `AbortError` (user cancellation)

### Data Flow

* The module MUST trigger a custom event named `dataLoaded` when processing completes
* The module MUST pass the processed data object as the event detail
* The module MUST add a `data-loaded` class to the document body when data is loaded
* The module MUST hide the file selection section when data is loaded

## User Interface

### Elements

* **Select Directory Button** - Primary action to initiate directory selection
* **Status Bar** - Shows processing progress (hidden by default)
* **Status Text** - Describes current processing state
* **Progress Fill** - Visual progress bar (width 0-100%)
* **Error Modal** - Shows error messages (hidden by default)
* **Error Message** - Contains error text content
* **Close Error Button** - Dismisses the error modal
* **Fallback File Input** - Hidden input for browsers without File System Access API

## Dependencies

* File System Access API (optional, with fallback)
* Custom event system (`window.dispatchEvent`, `CustomEvent`)
