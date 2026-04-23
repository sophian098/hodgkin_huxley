// SVG chart renderers
// all three charts share renderChart and only the domain/ticks/series/legend differ.

const X_TICKS = [0, 10, 20, 30, 40, 50]
const DEFAULT_TIME_MAX = 50

const BASE = {
  width: 820,
  xTicks: X_TICKS,
  xLabel: "Time (ms)",
}

// figures out the x-axis range from 0ms to the last saved time point
function timeDomain(time) {
  return [0, lastTime(time)]
}

// creates one legend label with a small colored square next to it
function legendItem({ color, label, className = "", swatchClassName = "" }) {
  const itemCls = ["chart-legend-item", className].filter(Boolean).join(" ")
  const swatchCls = ["chart-legend-swatch", swatchClassName].filter(Boolean).join(" ")
  const swatchStyle = color ? ` style="background:${color}"` : ""
  return `<span class="${itemCls}"><span class="${swatchCls}"${swatchStyle}></span>${label}</span>`
}

// draws the main action potential chart showing membrane voltage over time
export function renderVoltageChart(data) {
  const volts = data.voltage.filter(Number.isFinite)
  const vMin = volts.length ? Math.min(...volts) : -90
  const vMax = volts.length ? Math.max(...volts) : 120
  const pad = Math.max((vMax - vMin) * 0.1, 8)

  let yMin = -90
  let yMax = 120
  if (vMin < yMin) yMin = Math.floor(vMin - pad)
  if (vMax > yMax) yMax = Math.ceil(vMax + pad)

  const yTicks = buildTicks(yMin, yMax, 6)

  return renderChart({
    ...BASE,
    height: 420,
    margin: { top: 24, right: 22, bottom: 52, left: 74 },
    time: data.time,
    xDomain: timeDomain(data.time),
    yDomain: [yMin, yMax],
    yTicks,
    series: [{ values: data.voltage, color: "#4568db" }],
    yLabel: "V (mV)",
    ariaLabel: "Voltage over time",
    zeroLine: true,
    thresholdLine: -55,
    restingLine: -65,
    legend: [
      legendItem({ color: "#4568db", label: "V (mV)" }),
      legendItem({
        label: "Threshold (-55 mV)",
        className: "chart-legend-threshold",
        swatchClassName: "chart-legend-swatch-threshold",
      }),
      legendItem({
        label: "Resting (-65 mV)",
        className: "chart-legend-resting",
        swatchClassName: "chart-legend-swatch-resting",
      }),
    ].join(""),
    legendPosition: "bottom",
    legendClass: "chart-legend-voltage",
  })
}

// draws the n, m, and h gate probability chart
export function renderGatingChart(data) {
  return renderChart({
    ...BASE,
    height: 360,
    margin: { top: 26, right: 22, bottom: 52, left: 64 },
    time: data.time,
    xDomain: timeDomain(data.time),
    yDomain: [0, 1],
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yTickFormat: (t) => t.toFixed(2).replace(/\.00$/, ""),
    series: [
      { values: data.n, color: "#56a35a" },
      { values: data.m, color: "#cb4136" },
      { values: data.h, color: "#e39a22" },
    ],
    yLabel: "Probability",
    ariaLabel: "Gating variables over time",
    legend: [
      legendItem({ color: "#56a35a", label: "n (K activation)" }),
      legendItem({ color: "#cb4136", label: "m (Na activation)" }),
      legendItem({ color: "#e39a22", label: "h (Na inactivation)" }),
    ].join(""),
  })
}

// draws the sodium and potassium current chart
export function renderCurrentChart(data) {
  const [yMin, yMax] = currentDomain(data.iNa, data.iK)
  return renderChart({
    ...BASE,
    height: 360,
    margin: { top: 26, right: 22, bottom: 52, left: 70 },
    time: data.time,
    xDomain: timeDomain(data.time),
    yDomain: [yMin, yMax],
    yTicks: buildTicks(yMin, yMax, 5),
    series: [
      { values: data.iNa, color: "#cb4136" },
      { values: data.iK, color: "#56a35a" },
    ],
    yLabel: "I (uA/cm^2)",
    ariaLabel: "Ionic currents over time",
    zeroLine: true,
    legend: [
      legendItem({ color: "#cb4136", label: "I_Na (sodium)" }),
      legendItem({ color: "#56a35a", label: "I_K (potassium)" }),
    ].join(""),
  })
}

// builds the actual SVG chart using the settings passed in by each chart function
function renderChart(opts) {
  const {
    width, height, margin,
    time, xDomain, yDomain,
    xTicks, yTicks,
    yTickFormat = (v) => String(v),
    series,
    xLabel, yLabel, ariaLabel,
    zeroLine = false, thresholdLine = null, restingLine = null,
    legend = "", legendPosition = "top", legendClass = "",
  } = opts

  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const [xMin, xMax] = xDomain
  const [yMin, yMax] = yDomain

  const x = (v) => margin.left + ((v - xMin) / (xMax - xMin || 1)) * plotW
  const y = (v) => margin.top + ((yMax - v) / (yMax - yMin || 1)) * plotH

  const gridX = xTicks
    .map((t) => vLine(x(t), margin.top, height - margin.bottom, "chart-grid-line"))
    .join("")
  const gridY = yTicks
    .map((t) => hLine(margin.left, width - margin.right, y(t), "chart-grid-line"))
    .join("")

  const zero = zeroLine
    ? hLine(margin.left, width - margin.right, y(0), "chart-zero")
    : ""
  const threshold = thresholdLine != null
    ? hLine(margin.left, width - margin.right, y(thresholdLine), "chart-threshold")
    : ""
  const resting = restingLine != null
    ? hLine(margin.left, width - margin.right, y(restingLine), "chart-resting")
    : ""

  const axes =
    vLine(margin.left, margin.top, height - margin.bottom, "chart-axis") +
    hLine(margin.left, width - margin.right, height - margin.bottom, "chart-axis")

  const paths = series
    .map((s) => `<path d="${toPath(time, s.values, x, y)}" class="chart-line" stroke="${s.color}"/>`)
    .join("")

  const tickLabelsX = xTicks
    .map((t) => `<text x="${fx(x(t))}" y="${height - 18}" text-anchor="middle" class="chart-text">${t}</text>`)
    .join("")
  const tickLabelsY = yTicks
    .map((t) => `<text x="${margin.left - 10}" y="${fx(y(t) + 4)}" text-anchor="end" class="chart-text">${yTickFormat(t)}</text>`)
    .join("")

  const legendHtml = legend
    ? `<div class="chart-legend ${legendClass}">${legend}</div>`
    : ""

  const svg = `
<svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="${ariaLabel}">
  ${gridX}${gridY}
  ${zero}${threshold}${resting}
  ${axes}
  ${paths}
  ${tickLabelsX}${tickLabelsY}
  <text x="${width / 2}" y="${height - 2}" text-anchor="middle" class="chart-text chart-axis-label">${xLabel}</text>
  <text x="20" y="${height / 2}" text-anchor="middle" transform="rotate(-90 20 ${height / 2})" class="chart-text chart-axis-label">${yLabel}</text>
</svg>`

  return `<div class="chart-shell">${legendPosition === "top" ? legendHtml + svg : svg + legendHtml}</div>`
}

// SVG helpers

// formats chart coordinates so the SVG numbers stay short
function fx(n) { return n.toFixed(2) }

// creates a vertical SVG line (used for y-axis and vertical grid lines)
function vLine(xv, y1, y2, cls) {
  return `<line x1="${fx(xv)}" y1="${y1}" x2="${fx(xv)}" y2="${y2}" class="${cls}"/>`
}

// creates a horizontal SVG line (used for x-axis, grid lines, and reference lines)
function hLine(x1, x2, yv, cls) {
  return `<line x1="${x1}" y1="${fx(yv)}" x2="${x2}" y2="${fx(yv)}" class="${cls}"/>`
}

// converts time/data arrays into the SVG path commands that draw a curve
function toPath(time, values, x, y) {
  if (time.length === 0) return ""
  return time
    .map((t, i) => `${i === 0 ? "M" : "L"} ${fx(x(t))} ${fx(y(values[i] ?? 0))}`)
    .join(" ")
}

// gets the final time value, or falls back to the default chart length
function lastTime(time) {
  return time.length > 0 ? time[time.length - 1] : DEFAULT_TIME_MAX
}

// creates evenly spaced tick labels between the min and max values
function buildTicks(min, max, count) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [0]
  const step = (max - min) / count
  const ticks = Array.from({ length: count + 1 }, (_, i) =>
    Number((min + step * i).toFixed(1)),
  )
  return [...new Set(ticks)]
}

// finds a y-axis range big enough to include both sodium and potassium currents
function currentDomain(iNa, iK) {
  const all = [...iNa, ...iK].filter(Number.isFinite)
  const rawMin = all.length > 0 ? Math.min(...all, 0) : 0
  const rawMax = all.length > 0 ? Math.max(...all, 0) : 0
  const pad = Math.max((rawMax - rawMin) * 0.12, 1)
  let yMin = Math.floor(rawMin - pad)
  let yMax = Math.ceil(rawMax + pad)
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin >= yMax) {
    return [-1, 1]
  }
  return [yMin, yMax]
}
