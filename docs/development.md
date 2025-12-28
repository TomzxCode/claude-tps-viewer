# Development

## Setup

No build process is required for development. Simply open `index.html` in a browser.

For documentation development:

```bash
# Install dependencies (Python 3.14+)
uv sync

# Serve documentation locally
uv run mkdocs serve
```

## Project Structure

```
claude-tps-viewer/
├── index.html          # Main application
├── app.js              # Application initialization
├── styles.css          # Styling
├── js/
│   ├── dataProcessor.js    # Data pipeline
│   ├── fileHandler.js      # File handling
│   ├── chartRenderer.js    # Chart rendering
│   └── uiController.js     # UI management
├── docs/               # Documentation source
├── mkdocs.yml          # MkDocs configuration
├── pyproject.toml      # Python dependencies (docs)
└── uv.lock             # Locked dependencies
```

## Adding Features

### Adding a New Time Period

1. Add a new button in `index.html`:
```html
<button data-period="quarter">By Quarter</button>
```

2. Update `aggregateByPeriod()` in `js/dataProcessor.js`:
```javascript
case 'quarter':
    key = Math.floor(data.timestamp.getMonth() / 3) + 1;
    break;
```

### Adding a New Metric

1. Calculate in `calculateTurnTPS()` (dataProcessor.js)
2. Add to aggregation functions
3. Update chart traces in `renderChart()` (chartRenderer.js)
4. Add summary card in `index.html`

## Code Conventions

- Use descriptive function names
- Add JSDoc comments for functions
- Handle errors gracefully with try/catch
- Use const/let appropriately (no var)
- Follow existing formatting style

## Testing

Manual testing checklist:

- [ ] Load directory with multiple session files
- [ ] Verify all time period aggregations
- [ ] Test model filter
- [ ] Verify chart interactions (hover, zoom)
- [ ] Test table sorting and filtering
- [ ] Check error handling (invalid files)
- [ ] Test across browsers

## Building Documentation

```bash
uv run mkdocs build
```

Output is in `site/`.

## Release Process

1. Update version in `index.html` title
2. Update `README.md` if needed
3. Commit changes
4. Create git tag
5. Push to GitHub

## Dependencies

### JavaScript (CDN)

- jQuery 3.7.1
- Plotly.js 3.3.0
- DataTables 2.3.6
- DataTables ColumnControl 1.2.0

### Python (Documentation)

- MkDocs
- MkDocs Material theme

## License

MIT
