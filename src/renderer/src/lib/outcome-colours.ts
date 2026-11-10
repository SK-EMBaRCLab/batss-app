import type { DecisionRule, SimulationOutcome } from '@shared/simulation-types'

/**
 * Each outcome's colour, shared by the results bar chart and the decision
 * rule chart, so a rule's shading matches its outcome's bar.
 */
export const OUTCOME_COLOURS = {
  'Experimental Superior': 'var(--chart-2)',
  Futility: 'var(--chart-1)',
  Inconclusive: 'oklch(0.62 0 0)'
} as const satisfies Record<SimulationOutcome, string>

/** The outcome a rule stops the trial with. */
export const RULE_OUTCOME = {
  superiority: 'Experimental Superior',
  futility: 'Futility'
} as const satisfies Record<DecisionRule['type'], SimulationOutcome>
