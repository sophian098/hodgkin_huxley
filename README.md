# Neural Signal Visualizer

A tiny Hodgkin-Huxley action-potential explorer. Plain HTML + CSS + JavaScript,
no build step and no dependencies.

## Files

- `index.html` - markup + controls
- `style.css` - all styles
- `js/main.js` - wires DOM inputs to the simulation and re-renders on change
- `js/hh.js` - Hodgkin-Huxley simulation (forward Euler)
- `js/charts.js` - SVG chart renderers (voltage, gating, currents)

## Run it

ES modules require an HTTP server (opening `index.html` via `file://` will not
load the scripts). Any static server works. A couple of options:

```bash
# Python (comes with most systems)
python -m http.server 8000

# Node (no install, just npx)
npx http-server -p 8000
```

Then open http://localhost:8000 in a browser.
