import { simulateHodgkinHuxley } from "./hh.js"
import { renderCurrentChart, renderGatingChart, renderVoltageChart } from "./charts.js"

const $ = (id) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing element: #${id}`)
  return el
}

const inputs = {
  stimulus: $("input-stimulus"),
  duration: $("input-duration"),
  gNa: $("input-gna"),
  gK: $("input-gk"),
}

const sliderValues = {
  stimulus: $("value-stimulus"),
  duration: $("value-duration"),
  gNa: $("value-gna"),
  gK: $("value-gk"),
}

const paramLabels = {
  stimulus: $("param-stimulus"),
  duration: $("param-duration"),
  gNa: $("param-gna"),
  gK: $("param-gk"),
}

const heroStatus = $("hero-status")
const heroSubtitle = $("hero-subtitle")
const voltageRoot = $("voltage-chart-root")
const gatingRoot = $("gating-chart-root")
const currentRoot = $("current-chart-root")
const phaseCards = [0, 1, 2, 3].map((i) => $(`phase-card-${i}`))

function readParams() {
  return {
    stimulus: Number(inputs.stimulus.value),
    duration: Number(inputs.duration.value),
    gNa: Number(inputs.gNa.value),
    gK: Number(inputs.gK.value),
  }
}

function updateLabels(p) {
  sliderValues.stimulus.textContent = p.stimulus.toFixed(1)
  sliderValues.duration.textContent = p.duration.toFixed(1)
  sliderValues.gNa.textContent = p.gNa.toFixed(0)
  sliderValues.gK.textContent = p.gK.toFixed(0)

  paramLabels.stimulus.textContent = `${p.stimulus.toFixed(1)} uA/cm^2`
  paramLabels.duration.textContent = `${p.duration.toFixed(1)} ms`
  paramLabels.gNa.textContent = `${p.gNa.toFixed(0)} mS/cm^2`
  paramLabels.gK.textContent = `${p.gK.toFixed(0)} mS/cm^2`
}

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
