import { simulateHodgkinHuxley } from "./hh.js"
import { renderCurrentChart, renderGatingChart, renderVoltageChart } from "./charts.js"

const PARAMS = [
  { key: "stimulus", id: "stimulus", digits: 1, unit: "uA/cm^2" },
  { key: "duration", id: "duration", digits: 1, unit: "ms" },
  { key: "gNa", id: "gna", digits: 0, unit: "mS/cm^2" },
  { key: "gK", id: "gk", digits: 0, unit: "mS/cm^2" },
]

// gets an element by id and gives a clear error if it is missing
function $(id) {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing element: #${id}`)
  return el
}

// gathers the repeated input/value/label elements for each parameter
function paramElements(prefix) {
  return Object.fromEntries(
    PARAMS.map(({ key, id }) => [key, $(`${prefix}-${id}`)]),
  )
}

const inputs = paramElements("input")
const sliderValues = paramElements("value")
const paramLabels = paramElements("param")

const heroStatus = $("hero-status")
const heroSubtitle = $("hero-subtitle")
const voltageRoot = $("voltage-chart-root")
const gatingRoot = $("gating-chart-root")
const currentRoot = $("current-chart-root")
const phaseCards = [...document.querySelectorAll(".phase-card")]

// reads the current slider values as numbers for the simulation
function readParams() {
  return Object.fromEntries(
    PARAMS.map(({ key }) => [key, Number(inputs[key].value)]),
  )
}

// updates the visible slider values and parameter summary labels
function updateLabels(p) {
  for (const { key, digits, unit } of PARAMS) {
    const value = p[key].toFixed(digits)
    sliderValues[key].textContent = value
    paramLabels[key].textContent = `${value} ${unit}`
  }
}

// reruns the model and redraws the UI using the current slider settings
function render() {
  const params = readParams()
  updateLabels(params)

  const data = simulateHodgkinHuxley(params)

  heroStatus.textContent = data.didSpike ? "Action potential fired" : "No action potential"
  heroSubtitle.textContent = data.didSpike
    ? `${data.spikeCount} spike${data.spikeCount === 1 ? "" : "s"} detected - Hodgkin-Huxley model`
    : "Stimulus below threshold - increase current or duration to trigger a spike"

  voltageRoot.innerHTML = renderVoltageChart(data)
  gatingRoot.innerHTML = renderGatingChart(data)
  currentRoot.innerHTML = renderCurrentChart(data)

  phaseCards.forEach((card, i) => {
    const active = i === 0 || data.didSpike
    card.classList.toggle("phase-card-muted", !active)
  })
}

for (const input of Object.values(inputs)) {
  input.addEventListener("input", render)
}

render()
