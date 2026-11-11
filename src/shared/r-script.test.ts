import { describe, expect, test } from 'vitest'

import { runRScript } from './r-script'
import type { SimulationResultEntry, SimulationRunInput } from './simulation-types'

const DETAILS = { designName: 'My trial', appVersion: '6.1.0' }

type BinaryInput = Extract<SimulationRunInput, { outcomeType: 'binary' }>

const BINARY_INPUT: BinaryInput = {
  outcomeType: 'binary',
  probability: 0.3,
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: 1.5,
  N: 216,
  m0: 60,
  m: 12,
  R: 10,
  decisionRules: [
    { type: 'superiority', margin: 1, threshold: 0.95 },
    { type: 'futility', margin: 1.1, threshold: 0.1 }
  ]
}

const BINARY: SimulationResultEntry = {
  id: 'run-1',
  createdAt: '2026-11-10T20:05:00.000Z',
  input: BINARY_INPUT,
  result: { status: 'error', message: 'R stopped' }
}

const CONTINUOUS: SimulationResultEntry = {
  ...BINARY,
  input: {
    outcomeType: 'continuous',
    meanOutcome: 10,
    meanDiff: -2,
    sd: 4,
    N: 200,
    m0: 50,
    m: 10,
    R: 100,
    decisionRules: [{ type: 'futility', margin: 0, threshold: 0.05 }]
  }
}

describe('runRScript', () => {
  test('writes a binary run on the log-odds scale', () => {
    const script = runRScript(BINARY, DETAILS)
    expect(script).toContain('probability <- 0.3')
    expect(script).toContain('odds_ratio <- 1.5')
    expect(script).toContain('beta <- c(logit(probability), log(odds_ratio))')
    expect(script).toContain('family = "binomial"')
    expect(script).toContain('link = "logit"')
    expect(script).toContain('var = list(y = rbinom, group = alloc.balanced)')
    // As in batss-simulation.R: BATSS needs the arms' shares to add up to 1
    expect(script).toContain('prob0 = c(Control = 0.5, Experimental = 0.5)')
    expect(script).toContain('alternative = "greater"')
    // Odds ratio margins on the log scale, like beta[2]
    expect(script).toContain('delta.eff = log(1)')
    expect(script).toContain('delta.fut = log(1.1)')
    expect(script).toContain('N = 216')
    expect(script).toContain('interim = list(recruited = list(m0 = 60, m = 12))')
    expect(script).toContain('R = 10')
  })

  test('writes both rules, each with its formula', () => {
    const script = runRScript(BINARY, DETAILS)
    expect(script).toContain('# Superiority: stop if P(OR > 1) > 0.95')
    expect(script).toContain('eff.arm = eff.arm.simple')
    expect(script).toContain('eff.arm.control = list(b = 0.95)')
    expect(script).toContain('# Futility: stop if P(OR > 1.1) < 0.1')
    expect(script).toContain('fut.arm = fut.arm.simple')
    expect(script).toContain('fut.arm.control = list(b = 0.1)')
  })

  test('writes a continuous run with a futility rule only', () => {
    const script = runRScript(CONTINUOUS, DETAILS)
    expect(script).toContain('beta <- c(mean_outcome, mean_diff)')
    expect(script).toContain('sd <- 4')
    expect(script).toContain('var_control <- list(y = list(sd = sd))')
    expect(script).toContain('family = "gaussian"')
    expect(script).toContain('link = "identity"')
    expect(script).toContain('var = list(y = rnorm, group = alloc.balanced)')
    // A negative mean difference points the other way
    expect(script).toContain('alternative = "less"')
    expect(script).toContain('# Futility: stop if P(MD < 0) < 0.05')
    expect(script).toContain('eff.arm = NULL')
    expect(script).toContain('eff.arm.control = NULL')
    // The missing rule takes the other one's margin, as in the app
    expect(script).toContain('delta.eff = 0')
    expect(script).toContain('delta.fut = 0')
  })

  test('writes a superiority rule only', () => {
    const entry: SimulationResultEntry = {
      ...BINARY,
      input: { ...BINARY_INPUT, decisionRules: [BINARY_INPUT.decisionRules[0]] }
    }
    const script = runRScript(entry, DETAILS)
    expect(script).toContain('fut.arm = NULL')
    expect(script).toContain('fut.arm.control = NULL')
    expect(script).toContain('delta.fut = log(1)')
  })

  test('names the design, the run and the BATSS version it ran with', () => {
    const script = runRScript(
      {
        ...BINARY,
        name: 'Baseline',
        result: {
          status: 'success',
          package: '1.2.1',
          table: [],
          chart: [],
          sampleSize: {
            H0: { control: [], experimental: [] },
            H1: { control: [], experimental: [] }
          }
        }
      },
      DETAILS
    )
    expect(script.split('\n')[0]).toBe('# My trial – Baseline')
    expect(script).toContain('exported from BATSS Studio 6.1.0')
    expect(script).toContain('# The app ran it with BATSS 1.2.1.')
    expect(script).toContain('gives the same results as the app')
  })

  test("keeps a name on its comment line, so it can't add code", () => {
    const script = runRScript(
      { ...BINARY, name: 'Run\nsystem("rm -rf ~")\r\n# end' },
      { ...DETAILS, designName: 'Trial\u2028x' }
    )
    const lines = script.split('\n')
    expect(lines[0]).toBe('# Trial x – Run system("rm -rf ~") # end')
    expect(lines.filter((line) => line.includes('system('))).toHaveLength(1)
  })

  test('refuses a run with a value R could not read', () => {
    const entry: SimulationResultEntry = {
      ...BINARY,
      input: { ...BINARY_INPUT, probability: Number.NaN }
    }
    expect(() => runRScript(entry, DETAILS)).toThrow()
  })
})
