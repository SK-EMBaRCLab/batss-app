import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { designSchema } from './schema'

// What the form accepts and the message shown under each field. The form
// gets numbers as typed text, so most values here are strings.

const RULE = { type: 'superiority', direction: 'greater', margin: '1', threshold: '0.95' }

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
      'a futility rule',
      { decisionRules: [{ ...RULE, type: 'futility' }] },
      'decisionRules.0.type: Only superiority rules are currently supported.'
    ],
    [
      'a threshold above 1',
      { decisionRules: [{ ...RULE, threshold: '1.2' }] },
      'decisionRules.0.threshold: Decision threshold must be at most 1.'
    ],
    ['no decision rule', { decisionRules: [] }, 'decisionRules: Add at least one decision rule.']
  ])('rejects %s', (_label, change, problem) => {
    expect(problems({ ...BINARY, ...change })).toEqual([problem])
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

    test('a mean difference allows a superiority margin of 0', () => {
      expect(problems(CONTINUOUS)).toEqual([])
    })
  })
})
