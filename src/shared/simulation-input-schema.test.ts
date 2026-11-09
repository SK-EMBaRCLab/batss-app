import { describe, expect, test } from 'vitest'

import { checkSimulationRunInput } from './simulation-input-schema'

// The main process's own check before a run reaches R. Values arrive as
// numbers here (the form has already turned typed text into numbers).

const RULE = { type: 'superiority', margin: 1, threshold: 0.95 }
const FUTILITY = { type: 'futility', margin: 1, threshold: 0.05 }

const BINARY = {
  outcomeType: 'binary',
  probability: 0.3,
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: 1.5,
  N: 216,
  m0: 60,
  m: 12,
  R: 10,
  decisionRules: [RULE],
  corePercent: 75
}

const CONTINUOUS = {
  outcomeType: 'continuous',
  meanOutcome: 10,
  sd: 2.5,
  meanDiff: 3,
  N: 216,
  m0: 60,
  m: 12,
  R: 10,
  decisionRules: [{ ...RULE, margin: 0 }]
}

/** The message shown for the first problem, or null if the input can run. */
function problem(data: unknown): string | null {
  const checked = checkSimulationRunInput(data)
  if (checked.success) return null
  return checked.message.replace("These simulation settings can't be run: ", '')
}

describe('checkSimulationRunInput', () => {
  test('accepts binary and continuous designs', () => {
    expect(problem(BINARY)).toBeNull()
    expect(problem(CONTINUOUS)).toBeNull()
  })

  test.each([
    ['a futility rule on its own', [FUTILITY]],
    ['a superiority and a futility rule', [RULE, FUTILITY]],
    [
      'the same cutoffs with different margins',
      [RULE, { ...FUTILITY, margin: 1.2, threshold: 0.97 }]
    ]
  ])('accepts %s', (_label, decisionRules) => {
    expect(problem({ ...BINARY, decisionRules })).toBeNull()
  })

  test('drops the direction an older caller sends on a rule', () => {
    const checked = checkSimulationRunInput({
      ...BINARY,
      decisionRules: [{ ...RULE, direction: 'less' }]
    })
    expect(checked.success).toBe(true)
    if (checked.success) expect(checked.input.decisionRules[0]).not.toHaveProperty('direction')
  })

  test('starts every message the same way', () => {
    const checked = checkSimulationRunInput({ ...BINARY, R: 0 })
    expect(checked.success).toBe(false)
    if (!checked.success)
      expect(checked.message).toMatch(/^These simulation settings can't be run: /)
  })

  test('drops keys it does not know', () => {
    const checked = checkSimulationRunInput({ ...BINARY, unexpected: true })
    expect(checked.success).toBe(true)
    if (checked.success) expect(checked.input).not.toHaveProperty('unexpected')
  })

  test.each([
    [
      'an ordinal outcome',
      { outcomeType: 'ordinal' },
      'Only binary and continuous outcomes are supported.'
    ],
    ['a number sent as text', { N: '216' }, 'Maximum sample size must be a number.'],
    [
      'a probability of 1',
      { probability: 1 },
      'Control arm event probability must be less than 1.'
    ],
    [
      'a risk ratio',
      { treatmentEffectType: 'riskRatio' },
      'Only the odds ratio treatment effect is supported.'
    ],
    [
      'an odds ratio of 0',
      { treatmentEffect: 0 },
      'Treatment effect value (odds ratio) must be greater than 0.'
    ],
    ['too large a sample', { N: 100_001 }, 'Maximum sample size must be at most 100,000.'],
    [
      'an unknown rule type',
      { decisionRules: [{ ...RULE, type: 'harm' }] },
      'Decision rules must be superiority or futility rules.'
    ],
    [
      'two superiority rules',
      { decisionRules: [RULE, RULE] },
      'A design can have only one superiority rule and one futility rule.'
    ],
    [
      'three decision rules',
      { decisionRules: [RULE, FUTILITY, FUTILITY] },
      'A design can have at most two decision rules.'
    ],
    ['no decision rule', { decisionRules: [] }, 'A decision rule is required.'],
    [
      'a futility cutoff above 1',
      { decisionRules: [{ ...FUTILITY, threshold: 1.5 }] },
      'Futility cutoff must be at most 1.'
    ],
    [
      'a futility cutoff at the superiority cutoff with the same margin',
      { decisionRules: [RULE, { ...FUTILITY, threshold: 0.95 }] },
      'Futility cutoff must be less than the superiority cutoff when both rules use the same margin.'
    ],
    [
      'an odds ratio futility margin of 0',
      { decisionRules: [RULE, { ...FUTILITY, margin: 0 }] },
      'Futility margin must be greater than 0 for an odds ratio.'
    ],
    ['an unknown CPU share', { corePercent: 33 }, 'Core usage must be 25, 50, 75 or 100%.'],
    [
      'an odds ratio margin of 0',
      { decisionRules: [{ ...RULE, margin: 0 }] },
      'Superiority margin must be greater than 0 for an odds ratio.'
    ],
    [
      'a burn-in as large as the sample',
      { m0: 216 },
      'Maximum sample size must be greater than the burn-in sample size.'
    ]
  ])('rejects %s', (_label, change, message) => {
    expect(problem({ ...BINARY, ...change })).toBe(message)
  })

  // The same rules across fields as the form (shared/design-rules.ts)
  test('patients between interim analyses must fit after the burn-in', () => {
    expect(problem({ ...BINARY, m: 156 })).toBe(
      'Patients between interim analyses must be less than the maximum sample size minus the burn-in sample size.'
    )
    expect(problem({ ...BINARY, m: 155 })).toBeNull()
  })

  test('accepts negative margins for a mean difference', () => {
    const decisionRules = [
      { ...RULE, margin: -1 },
      { ...FUTILITY, margin: -0.5 }
    ]
    expect(problem({ ...CONTINUOUS, meanDiff: -3, decisionRules })).toBeNull()
  })

  test('rejects a negative odds ratio margin', () => {
    expect(problem({ ...BINARY, decisionRules: [{ ...RULE, margin: -1 }] })).toBe(
      'Superiority margin must be greater than 0 for an odds ratio.'
    )
  })

  test('rejects a standard deviation of 0', () => {
    expect(problem({ ...CONTINUOUS, sd: 0 })).toBe(
      'Standard deviation of the outcome must be greater than 0.'
    )
  })
})
