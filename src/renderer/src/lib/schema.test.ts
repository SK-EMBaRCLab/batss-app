import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { designInputFromRun, designSchema, initialDesignInput } from './schema'

// What the form accepts and the message shown under each field. The form
// gets numbers as typed text, so most values here are strings.

const RULE = { type: 'superiority', margin: '1', threshold: '0.95' }
const FUTILITY = { type: 'futility', margin: '1', threshold: '0.05' }

const BINARY = {
  outcomeType: 'binary',
  probability: '0.3',
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: '1.5',
  N: '216',
  m0: '60',
  m: '12',
  R: '10',
  decisionRules: [RULE],
  corePercent: 75
}

const CONTINUOUS = {
  outcomeType: 'continuous',
  meanOutcome: '10',
  sd: '2.5',
  meanDiff: '3',
  N: '216',
  m0: '60',
  m: '12',
  R: '10',
  decisionRules: [{ ...RULE, margin: '0' }]
}

/** Each problem as "field.path: message", like the form and batch import show them. */
function problems(data: unknown): string[] {
  const result = v.safeParse(designSchema, data)
  if (result.success) return []
  return result.issues.map((issue) => {
    const path = issue.path?.map((segment) => String(segment.key)).join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

describe('designSchema (the simulation form)', () => {
  test('accepts a binary design and turns typed text into numbers', () => {
    const result = v.safeParse(designSchema, BINARY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toMatchObject({ probability: 0.3, N: 216, m0: 60, m: 12, R: 10 })
      expect(result.output.decisionRules[0]).toMatchObject({ margin: 1, threshold: 0.95 })
    }
  })

  test('accepts a continuous design', () => {
    expect(problems(CONTINUOUS)).toEqual([])
  })

  test('asks for an outcome type', () => {
    expect(problems({ ...BINARY, outcomeType: undefined })).toEqual([
      'outcomeType: Please select an outcome type.'
    ])
  })

  test.each([
    [
      'an empty field',
      { probability: '' },
      'probability: Control arm event probability must be a number.'
    ],
    [
      'text',
      { probability: 'abc' },
      'probability: Control arm event probability must be a number.'
    ],
    [
      'a probability of 0',
      { probability: '0' },
      'probability: Control arm event probability must be greater than 0.'
    ],
    [
      'a probability of 1',
      { probability: '1' },
      'probability: Control arm event probability must be less than 1.'
    ],
    [
      'an odds ratio of 0',
      { treatmentEffect: '0' },
      'treatmentEffect: Treatment effect value (odds ratio) must be greater than 0.'
    ],
    [
      'a risk ratio',
      { treatmentEffectType: 'riskRatio' },
      'treatmentEffectType: Only odds ratio is currently supported.'
    ],
    ['a fraction of a patient', { N: '216.5' }, 'N: Maximum sample size must be a whole number.'],
    ['no simulated trials', { R: '0' }, 'R: Number of simulated trials must be greater than 0.'],
    [
      'too many simulated trials',
      { R: '100001' },
      'R: Number of simulated trials must be at most 100,000.'
    ],
    [
      'a superiority cutoff above 1',
      { decisionRules: [{ ...RULE, threshold: '1.2' }] },
      'decisionRules.0.threshold: Superiority cutoff must be at most 1.'
    ],
    [
      'a negative futility cutoff',
      { decisionRules: [{ ...FUTILITY, threshold: '-0.1' }] },
      'decisionRules.0.threshold: Futility cutoff must be at least 0.'
    ],
    [
      'an unknown rule type',
      { decisionRules: [{ ...RULE, type: 'harm' }] },
      'decisionRules.0.type: Select a decision rule type.'
    ],
    ['no decision rule', { decisionRules: [] }, 'decisionRules: Add at least one decision rule.'],
    [
      'two superiority rules',
      { decisionRules: [RULE, RULE] },
      'decisionRules: A design can have only one superiority rule and one futility rule.'
    ]
  ])('rejects %s', (_label, change, problem) => {
    expect(problems({ ...BINARY, ...change })).toEqual([problem])
  })

  test.each([
    ['a futility rule on its own', [FUTILITY]],
    ['a superiority and a futility rule', [RULE, FUTILITY]],
    ['the futility rule first', [FUTILITY, RULE]]
  ])('accepts %s', (_label, decisionRules) => {
    expect(problems({ ...BINARY, decisionRules })).toEqual([])
  })

  test('rejects more than two rules', () => {
    expect(problems({ ...BINARY, decisionRules: [RULE, FUTILITY, FUTILITY] })).toContain(
      'decisionRules: A design can have at most two decision rules.'
    )
  })

  test('drops the direction older designs stored on a rule', () => {
    const decisionRules = [{ ...RULE, direction: 'less' }]
    const result = v.safeParse(designSchema, { ...BINARY, decisionRules })
    expect(result.success).toBe(true)
    if (result.success) expect(result.output.decisionRules[0]).not.toHaveProperty('direction')
  })

  test('rejects a negative standard deviation', () => {
    expect(problems({ ...CONTINUOUS, sd: '-1' })).toEqual([
      'sd: Standard deviation of the outcome must be greater than 0.'
    ])
  })

  describe('rules across fields', () => {
    test('the burn-in must be smaller than the maximum sample size', () => {
      expect(problems({ ...BINARY, m0: '216' })).toContain(
        'N: Maximum sample size must be greater than the burn-in sample size.'
      )
    })

    // Confirmed as the correct rule: interim patients < N − burn-in
    test('patients between interim analyses must be less than the maximum sample size minus the burn-in', () => {
      const tooMany =
        'm: Patients between interim analyses must be less than the maximum sample size minus the burn-in sample size.'
      expect(problems({ ...BINARY, m: '156' })).toEqual([tooMany])
      expect(problems({ ...BINARY, m: '155' })).toEqual([])
    })

    test('an odds ratio needs a superiority margin above 0', () => {
      expect(problems({ ...BINARY, decisionRules: [{ ...RULE, margin: '0' }] })).toEqual([
        'decisionRules.0.margin: Superiority margin must be greater than 0 for an odds ratio.'
      ])
    })

    test('an odds ratio needs a futility margin above 0, shown under that rule', () => {
      const decisionRules = [RULE, { ...FUTILITY, margin: '0' }]
      expect(problems({ ...BINARY, decisionRules })).toEqual([
        'decisionRules.1.margin: Futility margin must be greater than 0 for an odds ratio.'
      ])
    })

    test('a mean difference allows a margin of 0', () => {
      expect(problems(CONTINUOUS)).toEqual([])
      const decisionRules = [
        { ...RULE, margin: '0' },
        { ...FUTILITY, margin: '0' }
      ]
      expect(problems({ ...CONTINUOUS, decisionRules })).toEqual([])
    })

    test('a mean difference allows negative margins', () => {
      const decisionRules = [
        { ...RULE, margin: '-1' },
        { ...FUTILITY, margin: '-0.5' }
      ]
      expect(problems({ ...CONTINUOUS, meanDiff: '-3', decisionRules })).toEqual([])
    })

    describe('with the same margin, the futility cutoff must be below the superiority cutoff', () => {
      const overlap =
        'Futility cutoff must be less than the superiority cutoff when both rules use the same margin.'

      test.each(['0.95', '0.97'])('a futility cutoff of %s is shown under it', (threshold) => {
        const decisionRules = [RULE, { ...FUTILITY, threshold }]
        expect(problems({ ...BINARY, decisionRules })).toEqual([
          `decisionRules.1.threshold: ${overlap}`
        ])
        expect(problems({ ...BINARY, decisionRules: decisionRules.toReversed() })).toEqual([
          `decisionRules.0.threshold: ${overlap}`
        ])
      })

      test('applies only when the margins are the same', () => {
        const decisionRules = [RULE, { ...FUTILITY, margin: '1.2', threshold: '0.97' }]
        expect(problems({ ...BINARY, decisionRules })).toEqual([])
      })
    })
  })
})

describe('designInputFromRun', () => {
  const common = { N: 216, m0: 60, m: 12, R: 10, decisionRules: [] }

  test("keeps the run's own values and leaves the other outcome's fields empty", () => {
    const input = designInputFromRun({
      outcomeType: 'binary',
      probability: 0.3,
      treatmentEffectType: 'oddsRatio',
      treatmentEffect: 1.5,
      corePercent: 50,
      ...common
    })
    expect(input).toMatchObject({ outcomeType: 'binary', probability: 0.3, corePercent: 50 })
    expect(input.meanDiff).toBeUndefined()
  })

  test('uses the default core usage for a run from before it was a setting', () => {
    const input = designInputFromRun({
      outcomeType: 'continuous',
      meanOutcome: 10,
      meanDiff: 3,
      sd: 2.5,
      ...common
    })
    expect(input.corePercent).toBe(initialDesignInput.corePercent)
    expect(input.probability).toBeUndefined()
  })
})
