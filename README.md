# Neural Signal Visualizer

A small Hodgkin-Huxley action potential visualizer built with HTML, CSS,
and JavaScript.

Adjust the inputs and watch the neuron’s voltage, ion gates, and currents change over time.

## Run

Because the app uses ES modules, open it through a local server:

```bash
npx http-server -p 8000
```

Then visit http://localhost:8000.

If you prefer python:

```bash
python -m http.server 8000
```

## What is inside

- `index.html` has the page and controls
- `style.css` has the styling
- `js/hh.js` runs the Hodgkin-Huxley simulation
- `js/charts.js` draws the SVG charts
- `js/main.js` connects the controls to the simulation
