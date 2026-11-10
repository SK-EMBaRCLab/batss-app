import type { SimulationChartRow } from '@shared/simulation-types'
import { describe, expect, test } from 'vitest'

import { OUTCOME_PRINT_COLOURS } from '@/lib/outcome-colours'

import { outcomeChartSvg } from './outcome-chart-svg'

const BOTH_RULES: SimulationChartRow[] = [
  { Scenario: 'Null Effect', Outcome: 'Experimental Superior', Proportion: 0.05 },
  { Scenario: 'Null Effect', Outcome: 'Futility', Proportion: 0.25 },
  { Scenario: 'Null Effect', Outcome: 'Inconclusive', Proportion: 0.7 },
  { Scenario: 'Target Effect', Outcome: 'Experimental Superior', Proportion: 0.75 },
  { Scenario: 'Target Effect', Outcome: 'Futility', Proportion: 0.05 },
  { Scenario: 'Target Effect', Outcome: 'Inconclusive', Proportion: 0.2 }
]

// The bars' outcomes, in the order they're drawn
const barOutcomes = (svg: string): string[] =>
  [...svg.matchAll(/data-outcome="([^"]+)"/g)].map((match) => match[1])

describe('outcomeChartSvg', () => {
  test('stacks superior at the bottom and futility on top, in each scenario', () => {
    const order = ['Experimental Superior', 'Inconclusive', 'Futility']
    expect(barOutcomes(outcomeChartSvg(BOTH_RULES))).toEqual([...order, ...order])
  })

  test("uses each outcome's print colour", () => {
    const svg = outcomeChartSvg(BOTH_RULES)
    for (const colour of Object.values(OUTCOME_PRINT_COLOURS)) {
      expect(svg).toContain(`fill="${colour}"`)
    }
  })

  test('draws the reference lines only when trials could stop for superiority', () => {
    expect(outcomeChartSvg(BOTH_RULES)).toContain('Power Target (80%)')

    const futilityOnly = BOTH_RULES.filter((row) => row.Outcome !== 'Experimental Superior')
    const svg = outcomeChartSvg(futilityOnly)
    expect(svg).not.toContain('Power Target')
    expect(barOutcomes(svg)).not.toContain('Experimental Superior')
  })
})
