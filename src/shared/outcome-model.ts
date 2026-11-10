// How batss-simulation.R models each outcome type: the GLM family and
// link, and the R function that simulates each patient's outcome. Shared
// so a run exported as an R script (r-script.ts) models it the same way.
import type { OutcomeType } from './simulation-types'

export type OutcomeModel = {
  family: 'binomial' | 'gaussian'
  link: 'logit' | 'identity'
  varY: 'rbinom' | 'rnorm'
}

/**
 * The model for an outcome type, or null for one that can't be run yet.
 * No default case: a new outcome type fails to compile here until it's
 * given a model (or null).
 */
export function outcomeModel(outcomeType: OutcomeType): OutcomeModel | null {
  switch (outcomeType) {
    case 'binary':
      return { family: 'binomial', link: 'logit', varY: 'rbinom' }
    case 'continuous':
      return { family: 'gaussian', link: 'identity', varY: 'rnorm' }
    case 'ordinal':
      return null
  }
}
