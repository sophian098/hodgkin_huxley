// SVG chart renderers. All three charts share `renderChart`; only the
// domain/ticks/series/legend differ.

const X_TICKS = [0, 10, 20, 30, 40, 50]

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
    width: 820,
    height: 420,
    margin: { top: 24, right: 22, bottom: 52, left: 74 },
    time: data.time,
    xDomain: [0, lastTime(data.time)],
    yDomain: [yMin, yMax],
    xTicks: X_TICKS,
    yTicks,
    series: [{ values: data.voltage, color: "#4568db" }],
    xLabel: "Time (ms)",
    yLabel: "V (mV)",
    ariaLabel: "Voltage over time",
    zeroLine: true,
    thresholdLine: -55,
    legend: `
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#4568db"></span>V (mV)</span>
      <span class="chart-legend-item chart-legend-threshold"><span class="chart-legend-swatch chart-legend-swatch-threshold"></span>Threshold (-55 mV)</span>
    `,
    legendPosition: "bottom",
    legendClass: "chart-legend-voltage",
  })
}

export function renderGatingChart(data) {
  return renderChart({
    width: 820,
    height: 360,
    margin: { top: 26, right: 22, bottom: 52, left: 64 },
    time: data.time,
    xDomain: [0, lastTime(data.time)],
    yDomain: [0, 1],
    xTicks: X_TICKS,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yTickFormat: (t) => t.toFixed(2).replace(/\.00$/, ""),
    series: [
      { values: data.n, color: "#56a35a" },
      { values: data.m, color: "#cb4136" },
      { values: data.h, color: "#e39a22" },
    ],
    xLabel: "Time (ms)",
    yLabel: "Probability",
    ariaLabel: "Gating variables over time",
    legend: `
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#56a35a"></span>n (K activation)</span>
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#cb4136"></span>m (Na activation)</span>
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#e39a22"></span>h (Na inactivation)</span>
    `,
  })
}

export function renderCurrentChart(data) {
  const [yMin, yMax] = currentDomain(data.iNa, data.iK)
  return renderChart({
    width: 820,
    height: 360,
    margin: { top: 26, right: 22, bottom: 52, left: 70 },
    time: data.time,
    xDomain: [0, lastTime(data.time)],
    yDomain: [yMin, yMax],
    xTicks: X_TICKS,
    yTicks: buildTicks(yMin, yMax, 5),
    series: [
      { values: data.iNa, color: "#cb4136" },
      { values: data.iK, color: "#56a35a" },
    ],
    xLabel: "Time (ms)",
    yLabel: "I (uA/cm^2)",
    ariaLabel: "Ionic currents over time",
    zeroLine: true,
    legend: `
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#cb4136"></span>I_Na (sodium)</span>
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:#56a35a"></span>I_K (potassium)</span>
    `,
  })
}

function renderChart(opts) {
  const {
    width, height, margin,
    time, xDomain, yDomain,
    xTicks, yTicks,
    yTickFormat = (v) => String(v),
    series,
    xLabel, yLabel, ariaLabel,
    zeroLine = false, thresholdLine = null,
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
  ${zero}${threshold}
  ${axes}
  ${paths}
  ${tickLabelsX}${tickLabelsY}
  <text x="${width / 2}" y="${height - 2}" text-anchor="middle" class="chart-text chart-axis-label">${xLabel}</text>
  <text x="20" y="${height / 2}" text-anchor="middle" transform="rotate(-90 20 ${height / 2})" class="chart-text chart-axis-label">${yLabel}</text>
</svg>`

  return `<div class="chart-shell">${legendPosition === "top" ? legendHtml + svg : svg + legendHtml}</div>`
}

// ── SVG helpers ────────────────────────────────────────────────

function fx(n) { return n.toFixed(2) }

function vLine(xv, y1, y2, cls) {
  return `<line x1="${fx(xv)}" y1="${y1}" x2="${fx(xv)}" y2="${y2}" class="${cls}"/>`
}
function hLine(x1, x2, yv, cls) {
  return `<line x1="${x1}" y1="${fx(yv)}" x2="${x2}" y2="${fx(yv)}" class="${cls}"/>`
}

function toPath(time, values, x, y) {
  if (time.length === 0) return ""
  return time
    .map((t, i) => `${i === 0 ? "M" : "L"} ${fx(x(t))} ${fx(y(values[i] ?? 0))}`)
    .join(" ")
}

function lastTime(time) {
  return time.length > 0 ? time[time.length - 1] : 50
}

function buildTicks(min, max, count) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [0]
  const step = (max - min) / count
  const ticks = Array.from({ length: count + 1 }, (_, i) =>
    Number((min + step * i).toFixed(1)),
  )
  return [...new Set(ticks)]
}

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
