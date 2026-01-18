# Chart Visualization

## Overview

The chart visualization module is responsible for rendering interactive charts using Plotly.js to display TPS metrics aggregated by various time periods or filtered by model.

## Requirements

### Chart Rendering

* The module MUST render a grouped bar chart showing TPS, ITPS, and OTPS metrics
* The module MUST use Plotly.js for chart rendering
* The module MUST accept aggregated TPS data as input
* The module MUST accept a period parameter to determine chart type
* The module MUST support the following period types: `session`, `hour`, `dayOfWeek`, `dayOfMonth`, `month`

### Chart Data

* The module MUST create three trace objects: TPS, ITPS, and OTPS
* The module MUST use distinct colors for each trace:
  - TPS: Green (rgba(39, 174, 96, 0.7))
  - ITPS: Blue (rgba(52, 152, 219, 0.7))
  - OTPS: Purple (rgba(155, 89, 182, 0.7))
* The module MUST include hover templates showing:
  - Label (x-axis value)
  - Metric value with 2 decimal places
  - Turn count
  - Total tokens

### Chart Layout

* The module MUST set an appropriate chart title based on the selected period
* The module MUST set appropriate x-axis titles based on the selected period
* The module MUST set the y-axis title to "Tokens Per Second"
* The module MUST use grouped bar mode (`barmode: 'group'`)
* The module MUST set appropriate margins for chart display
* The module MUST enable closest hover mode

### Chart Configuration

* The module MUST enable responsive mode
* The module MUST display the mode bar
* The module MUST remove lasso2d and select2d buttons from mode bar
* The module MUST hide the Plotly logo

### Chart Titles

* The module MUST display the following titles based on period:
  - `session`: "TPS/ITPS/OTPS Per Session"
  - `hour`: "TPS/ITPS/OTPS By Hour of Day"
  - `dayOfWeek`: "TPS/ITPS/OTPS By Day of Week"
  - `dayOfMonth`: "TPS/ITPS/OTPS By Day of Month"
  - `month`: "TPS/ITPS/OTPS By Month"

### X-Axis Titles

* The module MUST display the following x-axis titles based on period:
  - `session`: "Session"
  - `hour`: "Hour (0-23)"
  - `dayOfWeek`: "Day"
  - `dayOfMonth`: "Day of Month"
  - `month`: "Month"

## Dependencies

* Plotly.js (loaded via CDN)
* Aggregated TPS data from data processing module
