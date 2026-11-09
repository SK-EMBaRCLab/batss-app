import { describe, expect, test } from 'vitest'

import { decisionRuleSummaries } from './design-fields'

const SUPERIORITY = { type: 'superiority', margin: 1, threshold: 0.95 } as const
const FUTILITY = { type: 'futility', margin: 1, threshold: 0.05 } as const

describe('decisionRuleSummaries', () => {
  test('lists superiority first, whatever order the rules are in', () => {
    const summaries = decisionRuleSummaries({
      outcomeType: 'binary',
      treatmentEffectType: 'oddsRatio',
      treatmentEffect: 1.5,
      decisionRules: [FUTILITY, SUPERIORITY]
    })
    expect(summaries).toEqual([
      { type: 'superiority', title: 'Superiority rule', formula: 'P(OR > 1) > 0.95' },
      { type: 'futility', title: 'Futility rule', formula: 'P(OR > 1) < 0.05' }
    ])
  })

  test('follows the direction of the treatment effect', () => {
    const summaries = decisionRuleSummaries({
      outcomeType: 'continuous',
      meanDiff: -3,
      decisionRules: [{ type: 'futility', margin: -1, threshold: 0.1 }]
    })
    expect(summaries.map((rule) => rule.formula)).toEqual(['P(MD < -1) < 0.1'])
  })

  test('is empty without an outcome type it can describe', () => {
    expect(decisionRuleSummaries({ decisionRules: [SUPERIORITY] })).toEqual([])
    expect(decisionRuleSummaries({ outcomeType: 'ordinal', decisionRules: [SUPERIORITY] })).toEqual(
      []
    )
  })
})
