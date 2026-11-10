import { describe, expect, test } from 'vitest'

import { decisionRuleFormula } from './decision-rule-formula'

const BINARY = {
  outcomeType: 'binary',
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: 1.5
} as const
const CONTINUOUS = { outcomeType: 'continuous', meanDiff: 3 } as const

describe('decisionRuleFormula', () => {
  test('superiority compares above its cutoff, futility below', () => {
    expect(decisionRuleFormula({ type: 'superiority', margin: 1, threshold: 0.95 }, BINARY)).toBe(
      'P(OR > 1) > 0.95'
    )
    expect(decisionRuleFormula({ type: 'futility', margin: 1, threshold: 0.05 }, BINARY)).toBe(
      'P(OR > 1) < 0.05'
    )
  })

  test('uses MD for a continuous outcome and the effect symbol otherwise', () => {
    const rule = { type: 'superiority', margin: 0, threshold: 0.9 } as const
    expect(decisionRuleFormula(rule, CONTINUOUS)).toBe('P(MD > 0) > 0.9')
    expect(decisionRuleFormula(rule, { ...BINARY, treatmentEffectType: 'riskRatio' })).toBe(
      'P(RR > 0) > 0.9'
    )
  })

  test('follows the direction of the treatment effect, including typed text', () => {
    const rule = { type: 'futility', margin: '-1', threshold: '0.1' } as const
    expect(decisionRuleFormula(rule, { ...CONTINUOUS, meanDiff: '-3' })).toBe('P(MD < -1) < 0.1')
    expect(decisionRuleFormula(rule, { ...BINARY, treatmentEffect: '0.7' })).toBe(
      'P(OR < -1) < 0.1'
    )
  })

  test("shows a missing margin or cutoff as the rule's default for the outcome", () => {
    expect(decisionRuleFormula({ type: 'superiority' }, CONTINUOUS)).toBe('P(MD > 0) > 0.95')
    expect(decisionRuleFormula({ type: 'futility' }, BINARY)).toBe('P(OR > 1) < 0.05')
  })
})
