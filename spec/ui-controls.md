# UI Controls

## Overview

The UI controls module is responsible for managing the application's user interface, including the dashboard, summary cards, model statistics, sessions table, time period filters, and model filter dropdowns.

## Requirements

### Dashboard Display

* The module MUST hide the dashboard by default until data is loaded
* The module MUST show the dashboard when the `dataLoaded` event is received
* The module MUST populate all summary cards with data from the loaded dataset

### Summary Cards

* The module MUST display the following summary metrics:
  - Total Sessions
  - Average TPS (2 decimal places)
  - Average ITPS (2 decimal places)
  - Average OTPS (2 decimal places)
  - Total Input Tokens (with locale formatting)
  - Total Output Tokens (with locale formatting)
  - Total Tokens (with locale formatting)

### Model Statistics

* The module MUST render a card for each model found in the dataset
* The module MUST display the following metrics per model:
  - Model name
  - Average TPS (2 decimal places)
  - Average ITPS (2 decimal places)
  - Average OTPS (2 decimal places)
  - Turn count (with locale formatting)
  - Input tokens (with locale formatting)
  - Output tokens (with locale formatting)
  - Total tokens (with locale formatting)
  - Total duration (human-readable format)
* The module MUST escape HTML in model names to prevent XSS

### Time Period Filters

* The module MUST provide buttons for the following time periods:
  - Session
  - Hour
  - Day of Week
  - Day of Month
  - Month
* The module MUST mark the active period button with an `active` class
* The module MUST update the chart when a period button is clicked
* The module MUST respect the current model filter when updating the chart

### Model Filter

* The module MUST provide a dropdown to filter by model
* The module MUST include an "All Models" option
* The module MUST populate the dropdown with all models from the dataset
* The module MUST synchronize two model filter dropdowns (if present)
* The module MUST update the sessions table when model filter changes
* The module MUST update the chart when model filter changes

### Sessions Table

* The module MUST render a DataTable with the following columns:
  - Session ID (as code element)
  - Date (locale date string)
  - Turn count
  - Total tokens (with locale formatting)
  - Input tokens (with locale formatting)
  - Output tokens (with locale formatting)
  - Average TPS (2 decimal places)
  - Average ITPS (2 decimal places)
  - Average OTPS (2 decimal places)
  - Models (comma-separated list)
* The module MUST sort sessions by timestamp descending (newest first)
* The module MUST filter sessions by selected model when a model filter is active
* The module MUST destroy and recreate the DataTable when data changes
* The module MUST set default page length to 25 rows
* The module MUST set default sort order to date descending
* The module MUST escape HTML in session IDs to prevent XSS

### Duration Formatting

* The module MUST format durations under 60 seconds as "X.Xs"
* The module MUST format durations under 1 hour as "Xm Ys"
* The module MUST format durations of 1 hour or more as "Xh Ym"

### HTML Escaping

* The module MUST escape user-generated content before rendering to prevent XSS attacks
* The module MUST escape model names and session IDs

## User Interface Elements

### Summary Cards

* `#total-sessions` - Total session count
* `#average-tps` - Average TPS value
* `#average-itps` - Average ITPS value
* `#average-otps` - Average OTPS value
* `#total-input-tokens` - Total input tokens
* `#total-output-tokens` - Total output tokens
* `#total-tokens` - Total tokens

### Controls

* `#model-select` - Model filter dropdown (table section)
* `#model-select-chart` - Model filter dropdown (chart section)
* `.time-period-tabs button` - Time period filter buttons (with `data-period` attribute)

### Display Areas

* `#dashboard` - Main dashboard container
* `#model-stats` - Model statistics container
* `#sessions-table` - Sessions table container
* `#tps-chart` - Chart container (managed by ChartRenderer)

## Dependencies

* DataTables.net (for session table)
* jQuery (required by DataTables)
* ChartRenderer module (for chart updates)
