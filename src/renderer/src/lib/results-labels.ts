import type { SimulationScenario } from '@shared/simulation-types'

/** How each scenario is named on the results page, the same in every table and chart. */
export const SCENARIO_LABELS = {
  'Null Effect': 'Null Effect Scenario',
  'Target Effect': 'Target Effect Scenario'
} as const satisfies Record<SimulationScenario, string>

// The reference lines' targets, for the Experimental Superior bar: the
// share stopped for superiority with no effect (type I error) and with the
// target effect (power)
export const TYPE_I_ERROR_TARGET = 0.05
export const POWER_TARGET = 0.8

/** The reference lines only apply when trials could stop for superiority. */
export function hasSuperiorOutcome(rows: readonly { Outcome: string }[]): boolean {
  return rows.some((row) => row.Outcome === 'Experimental Superior')
}
