import type { DecisionRule, SimulationOutcome } from '@shared/simulation-types'

/**
 * Each outcome's colour, shared by the results bar chart and the decision
 * rule chart, so a rule's shading matches its outcome's bar.
 */
export const OUTCOME_COLOURS = {
  // Green
  'Experimental Superior': 'var(--chart-3)',
  // Light yellow, a paler --chart-2
  Futility: 'oklch(0.89 0.12 92)',
  // Grey
  Inconclusive: 'oklch(0.62 0 0)'
} as const satisfies Record<SimulationOutcome, string>

/**
 * Each outcome's colour by name, for text that points at it (the decision
 * rule preview's "shaded in green"). The same in the light and dark
 * themes. Change them together with OUTCOME_COLOURS.
 */
export const OUTCOME_COLOUR_NAMES = {
  'Experimental Superior': 'green',
  Futility: 'yellow',
  Inconclusive: 'grey'
} as const satisfies Record<SimulationOutcome, string>

/**
 * The decision rule chart's other marks, named in the preview's text
 * ("distribution in blue; margin in red"), so the text, its colour dots
 * and the chart agree
 */
export const DECISION_CHART_COLOURS = {
  distribution: { colour: 'var(--chart-1)', name: 'blue' },
  margin: { colour: 'var(--destructive)', name: 'red' }
} as const

/** How opaque the chart's shading is, which its colour dot matches. */
export const DECISION_SHADING_OPACITY = 0.55

/**
 * The same colours as fixed hex values, the light theme's, for files the
 * app makes (the Word report's chart): a document can't use the app's
 * theme. Change them together with OUTCOME_COLOURS.
 */
export const OUTCOME_PRINT_COLOURS = {
  'Experimental Superior': '#419547',
  Futility: '#F7D979',
  Inconclusive: '#868686'
} as const satisfies Record<SimulationOutcome, string>

/** The outcome a rule stops the trial with. */
export const RULE_OUTCOME = {
  superiority: 'Experimental Superior',
  futility: 'Futility'
} as const satisfies Record<DecisionRule['type'], SimulationOutcome>
