// The rules a study design's values follow, written once. Built on by the
// simulation form (renderer lib/schema.ts), the main process's check
// before a run (simulation-input-schema.ts) and, for the lists of allowed
// values, the .design file check (design-file-schema.ts) and the types
// (simulation-types.ts). Change a rule here and every check follows.
import * as v from 'valibot'

import { FIELD_LABELS as L } from './field-labels'

// Upper limits, far above any real design (the largest runs so far are
// N≈200 and R=1,000), so a typo or a bad CSV can't tie R up for hours or
// build an input too large to hand to R
export const MAX_SAMPLE_SIZE = 100_000
export const MAX_SIMULATED_TRIALS = 100_000
export const MAX_BATCH_ROWS = 500

// Allowed values. Some can be stored and picked in the form but can't be
// run yet (ordinal outcomes, risk difference and ratio, futility rules);
// the form and the run check each say which they accept.
export const OUTCOME_TYPES = ['binary', 'continuous', 'ordinal'] as const
export const TREATMENT_EFFECT_TYPES = ['oddsRatio', 'riskDifference', 'riskRatio'] as const
export const DECISION_RULE_TYPES = ['superiority', 'futility'] as const
export const DIRECTIONS = ['greater', 'less'] as const
export const CORE_PERCENTS = [25, 50, 75, 100] as const

const finiteNumber = (label: string): v.GenericSchema<number> =>
  v.pipe(v.number(`${label} must be a number.`), v.finite(`${label} must be a finite number.`))

const positiveInteger = (label: string, max: number): v.GenericSchema<number> =>
  v.pipe(
    finiteNumber(label),
    v.integer(`${label} must be a whole number.`),
    v.minValue(1, `${label} must be greater than 0.`),
    v.maxValue(max, `${label} must be at most ${max.toLocaleString('en-CA')}.`)
  )

/**
 * Each numeric field's rules, for a value that's already a number. The
 * form puts its text-to-number step in front of these.
 */
export const NUMBER_FIELDS = {
  probability: v.pipe(
    finiteNumber(L.probability),
    v.gtValue(0, `${L.probability} must be greater than 0.`),
    v.ltValue(1, `${L.probability} must be less than 1.`)
  ),
  // An odds ratio, the only treatment effect that can be run so far
  treatmentEffect: v.pipe(
    finiteNumber(L.treatmentEffect),
    v.gtValue(0, `${L.treatmentEffect} (odds ratio) must be greater than 0.`)
  ),

  meanOutcome: finiteNumber(L.meanOutcome),
  meanDiff: finiteNumber(L.meanDiff),
  sd: v.pipe(finiteNumber(L.sd), v.gtValue(0, `${L.sd} must be greater than 0.`)),

  N: positiveInteger(L.N, MAX_SAMPLE_SIZE),
  m0: positiveInteger(L.m0, MAX_SAMPLE_SIZE),
  m: positiveInteger(L.m, MAX_SAMPLE_SIZE),
  R: positiveInteger(L.R, MAX_SIMULATED_TRIALS),

  margin: v.pipe(finiteNumber(L.margin), v.minValue(0, `${L.margin} must be at least 0.`)),
  threshold: v.pipe(
    finiteNumber(L.threshold),
    v.minValue(0, `${L.threshold} must be at least 0.`),
    v.maxValue(1, `${L.threshold} must be at most 1.`)
  )
}

/** Any number, for fields with no rules of their own (ordinal outcomes, for now). */
export const anyNumber = finiteNumber

type SampleSizes = { N: number; m0: number; m: number }

/** Rules between fields. The form shows each message under the field named in its comment. */
export const CROSS_FIELD_RULES = {
  // Shown under N
  burnInBelowMaximum: {
    holds: (input: SampleSizes): boolean => input.N > input.m0,
    message: `${L.N} must be greater than the ${L.m0.toLowerCase()}.`
  },
  // Shown under m. Confirmed as the correct rule: interim patients must
  // fit in what's left of the maximum sample size after the burn-in
  interimFitsAfterBurnIn: {
    holds: (input: SampleSizes): boolean => input.m < input.N - input.m0,
    message: `${L.m} must be less than the ${L.N.toLowerCase()} minus the ${L.m0.toLowerCase()}.`
  },
  // Shown under the first rule's margin. For an odds ratio,
  // batss-simulation.R takes the log of the margin, so it must be above 0
  oddsRatioMargin: {
    holds: (rules: readonly { margin: number }[]): boolean =>
      rules.every((rule) => rule.margin > 0),
    message: `${L.margin} must be greater than 0 for an odds ratio.`
  }
}
