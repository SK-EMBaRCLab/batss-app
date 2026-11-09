// Which way the treatment effect points, BATSS's `alternative`. It follows
// the sign of beta[2], the group coefficient: log(odds ratio) for a binary
// outcome, the mean difference for a continuous one. Used by the decision
// rule formula and chart, and by the main process before a run.
import type { DIRECTIONS } from './design-rules'
import type { DesignInput } from './simulation-types'

export type Direction = (typeof DIRECTIONS)[number]

type EffectInput = {
  outcomeType?: DesignInput['outcomeType']
  // Typed text in the form, numbers everywhere else
  treatmentEffect?: string | number
  meanDiff?: string | number
}

// NaN for an empty or missing value, so it counts as no effect
function toNumber(value: string | number | undefined): number {
  if (value === undefined) return NaN
  if (typeof value === 'number') return value
  return value.trim() === '' ? NaN : Number(value)
}

/**
 * 'less' when the effect is below "no effect" (an odds ratio below 1,
 * since log(OR) < 0 exactly then, or a negative mean difference), else
 * 'greater'. An effect of exactly no effect, or one not entered yet,
 * counts as 'greater'.
 */
export function effectDirection(input: EffectInput): Direction {
  if (input.outcomeType === 'binary') {
    return toNumber(input.treatmentEffect) < 1 ? 'less' : 'greater'
  }

  if (input.outcomeType === 'continuous') {
    return toNumber(input.meanDiff) < 0 ? 'less' : 'greater'
  }

  return 'greater'
}
