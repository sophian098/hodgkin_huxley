// Hodgkin-Huxley model simulation (1952).
// Integrates membrane voltage and gating variables (n, m, h) with forward Euler.

export const HH_CONSTANTS = {
  Cm: 0.01,
  ENa: 55.17,
  EK: -72.14,
  EL: -49.42,
  gL: 0.003,
}

export const DEFAULT_PARAMS = {
  stimulus: 15,
  duration: 5,
  gNa: 1.2,
  gK: 0.36,
}

export function simulateHodgkinHuxley(params) {
  const dt = 0.025
  const totalTime = 50
  const steps = Math.floor(totalTime / dt)
  const storeEvery = 4
  const stimSteps = Math.floor(params.duration / dt)

  let voltage = -65
  let n = steadyState(voltage, alphaN, betaN)
  let m = steadyState(voltage, alphaM, betaM)
  let h = steadyState(voltage, alphaH, betaH)

  const time = []
  const voltageSeries = []
  const nSeries = []
  const mSeries = []
  const hSeries = []
  const iNaSeries = []
  const iKSeries = []

  let spikeCount = 0
  let inSpike = false

  for (let step = 0; step < steps; step += 1) {
    const currentTime = step * dt
    const stimulus = step < stimSteps ? params.stimulus : 0

    const iNa = params.gNa * m ** 3 * h * (voltage - HH_CONSTANTS.ENa)
    const iK = params.gK * n ** 4 * (voltage - HH_CONSTANTS.EK)
    const iL = HH_CONSTANTS.gL * (voltage - HH_CONSTANTS.EL)

    const dVoltage = (stimulus - iNa - iK - iL) / HH_CONSTANTS.Cm

    voltage += dVoltage * dt
    n = clamp01(n + (alphaN(voltage) * (1 - n) - betaN(voltage) * n) * dt)
    m = clamp01(m + (alphaM(voltage) * (1 - m) - betaM(voltage) * m) * dt)
    h = clamp01(h + (alphaH(voltage) * (1 - h) - betaH(voltage) * h) * dt)

    if (voltage > 0 && !inSpike) {
      spikeCount += 1
      inSpike = true
    }
    if (voltage < -50) {
      inSpike = false
    }

    if (step % storeEvery === 0) {
      time.push(round(currentTime, 2))
      voltageSeries.push(round(voltage, 2))
      nSeries.push(round(n, 4))
      mSeries.push(round(m, 4))
      hSeries.push(round(h, 4))
      iNaSeries.push(round(iNa, 4))
      iKSeries.push(round(iK, 4))
    }
  }

  return {
    time,
    voltage: voltageSeries,
    n: nSeries,
    m: mSeries,
    h: hSeries,
    iNa: iNaSeries,
    iK: iKSeries,
    spikeCount,
    didSpike: spikeCount > 0,
  }
}

// Rate functions (Hodgkin-Huxley 1952, shifted so rest = -65 mV).

function alphaN(v) { return stableRate(0.01, v + 50, 10, 0.1) }
function betaN(v)  { return 0.125 * Math.exp(-(v + 60) / 80) }
function alphaM(v) { return stableRate(0.1, v + 35, 10, 1) }
function betaM(v)  { return 4 * Math.exp(-0.0556 * (v + 60)) }
function alphaH(v) { return 0.07 * Math.exp(-0.05 * (v + 60)) }
function betaH(v)  { return 1 / (1 + Math.exp(-0.1 * (v + 30))) }

// Uses a fallback near the removable singularity where offset -> 0.
function stableRate(scale, offset, divisor, fallback) {
  const denominator = 1 - Math.exp(-offset / divisor)
  if (Math.abs(denominator) < 1e-7) return fallback
  return (scale * offset) / denominator
}

function steadyState(voltage, alpha, beta) {
  const a = alpha(voltage)
  const b = beta(voltage)
  return a / (a + b)
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function round(value, digits) {
  return Number(value.toFixed(digits))
}
