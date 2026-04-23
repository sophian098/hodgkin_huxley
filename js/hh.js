// Hodgkin-Huxley model simulation (1952)

// constants are based off of McGill but adjusted to have resting at -65mV
// https://www.math.mcgill.ca/gantumur/docs/reps/RyanSicilianoHH.pdf
export const HH_CONSTANTS = {
  Cm: 1, // membrane capacitance
  ENa: 50, // sodium reversal potential
  EK: -77, // potassium reversal potential
  EL: -54.4, // leak reversal potential
  gL: 0.3, // leak conductance
}

export const DEFAULT_PARAMS = {
  stimulus: 15,
  duration: 5,
  gNa: 120,
  gK: 36,
}

export function simulateHodgkinHuxley(params) {
  const dt = 0.025 // delta time (0.025 ms per step)
  const totalTime = 50 // whole simulation runs 50ms
  const steps = Math.floor(totalTime / dt) // steps aka total number of updates needed to cover totalTime
  const storeEvery = 4 // controls how often the function saves data for the charts (only stores every 4th pt)
  const stimSteps = Math.floor(params.duration / dt) // how many simulation steps the stimulus should stay on

  // initial conditions
  let voltage = -65
  // set n, m, and h to the values they would naturally settle to at -65 mV
  // note: n, m, and h are the probability of gates being open
  let n = steadyState(voltage, alphaN, betaN)
  let m = steadyState(voltage, alphaM, betaM)
  let h = steadyState(voltage, alphaH, betaH)

  // stores simulation results over time
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

    // HH current equations
    // iNa: params.gNa: max Na conductance, m** 3: Na activation, h: Na inactivation, voltage - ENa: Na driving force
    // iNa: params.gK: max Kconductance, n ** 4: K activation, voltage - EK: K driving force
    const iNa = params.gNa * m ** 3 * h * (voltage - HH_CONSTANTS.ENa)
    const iK = params.gK * n ** 4 * (voltage - HH_CONSTANTS.EK)
    const iL = HH_CONSTANTS.gL * (voltage - HH_CONSTANTS.EL)

    // calculate voltage slope (main HH eq: dV/dt = (I - INa - IK - IL)/Cm)
    const dVoltage = (stimulus - iNa - iK - iL) / HH_CONSTANTS.Cm

    // forward euler to approx differential eq: new voltage = old voltage + ( dV/dT * dT )
    voltage += dVoltage * dt
    // update gates
    n = clamp01(n + (alphaN(voltage) * (1 - n) - betaN(voltage) * n) * dt) //n_new = n_old + (dn/dt) * dt and dn/dt = alphaN(V)(1 - n) - betaN(V)n aka closed n gates - open n gates
    m = clamp01(m + (alphaM(voltage) * (1 - m) - betaM(voltage) * m) * dt)
    h = clamp01(h + (alphaH(voltage) * (1 - h) - betaH(voltage) * h) * dt)

    if (voltage > 0 && !inSpike) {
      spikeCount += 1
      inSpike = true
    }
    if (voltage < -50) {
      inSpike = false
    }

    // store data for charts
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
/**
 * Rate functions
 * alpha: rate of moving to permissive state
 * beta: rate of moving to non-permissive state
 * more info: The Core Equation of Neuroscience by Artem Kirsanov (https://www.youtube.com/watch?v=zOmhHE2xctw)
 * equations are from McGill but shifted so rest = -65mV
 */
function alphaN(v) { return stableRate(0.01, v + 55, 10, 0.1) } // rate at which closed n gates open
function betaN(v)  { return 0.125 * Math.exp(-(v + 65) / 80) } // rate at which open n gates close
function alphaM(v) { return stableRate(0.1, v + 40, 10, 1) }
function betaM(v)  { return 4 * Math.exp(-(v + 65) / 18) }
function alphaH(v) { return 0.07 * Math.exp(-(v + 65) / 20) }
function betaH(v)  { return 1 / (1 + Math.exp(-(v + 35) / 10)) }

// evaluates rate formulas of the form: scale * offset / (1 - exp(-offset / divisor))
// when offset is near 0, the formula becomes 0/0, so use the known limiting value instead
function stableRate(scale, offset, divisor, fallback) {
  const denominator = 1 - Math.exp(-offset / divisor)
  if (Math.abs(denominator) < 1e-7) return fallback // checks whether the denominator is close to zero that dividing by it would be unsafe
  return (scale * offset) / denominator
}

// computes the initial/resting gate value for n, m, or h
function steadyState(voltage, alpha, beta) {
  const a = alpha(voltage)
  const b = beta(voltage)
  return a / (a + b)
}

// forces a value to stay btwn 0 and 1 (needed bc n, m, h are probabilities)
function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

// rounds a number to the requested decimal places
function round(value, digits) {
  return Number(value.toFixed(digits))
}
