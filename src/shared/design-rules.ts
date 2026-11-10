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

// A run's own name and notes (see SimulationResultEntry)
export const MAX_RUN_NAME_LENGTH = 100
export const MAX_RUN_NOTES_LENGTH = 2000

// Allowed values. Some can be stored and picked in the form but can't be
// run yet (ordinal outcomes, risk difference and ratio);
// the form and the run check each say which they accept.
export const OUTCOME_TYPES = ['binary', 'continuous', 'ordinal'] as const
export const TREATMENT_EFFECT_TYPES = ['oddsRatio', 'riskDifference', 'riskRatio'] as const
export const DECISION_RULE_TYPES = ['superiority', 'futility'] as const
export const DIRECTIONS = ['greater', 'less'] as const
export const CORE_PERCENTS = [25, 50, 75, 100] as const
// How a simulated trial ended, as batss-simulation.R labels BATSS's
// groupExperimental codes 1, 2 and 0
export const SIMULATION_OUTCOMES = ['Experimental Superior', 'Futility', 'Inconclusive'] as const
// The two scenarios BATSS simulates, as batss-simulation.R names them:
// H0 with no treatment effect, H1 with the target effect
export const SIMULATION_SCENARIOS = ['Null Effect', 'Target Effect'] as const
export const SCENARIO_OF = { H0: 'Null Effect', H1: 'Target Effect' } as const satisfies Record<
  'H0' | 'H1',
  (typeof SIMULATION_SCENARIOS)[number]
>

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
  R: positiveInteger(L.R, MAX_SIMULATED_TRIALS)
}

type DecisionRuleType = (typeof DECISION_RULE_TYPES)[number]

/** What each rule's margin and cutoff are called, for its messages. */
export const DECISION_RULE_LABELS = {
  superiority: { margin: L.superiorityMargin, threshold: L.superiorityThreshold },
  futility: { margin: L.futilityMargin, threshold: L.futilityThreshold }
} as const satisfies Record<DecisionRuleType, { margin: string; threshold: string }>

// Any number: a mean difference margin can be negative (for example −1
// when lower is better). An odds ratio margin must be above 0, which
// CROSS_FIELD_RULES.oddsRatioMargin checks.
const marginField = (label: string): v.GenericSchema<number> => finiteNumber(label)

// The cutoff on the posterior probability, stored as `threshold`
const thresholdField = (label: string): v.GenericSchema<number> =>
  v.pipe(
    finiteNumber(label),
    v.minValue(0, `${label} must be at least 0.`),
    v.maxValue(1, `${label} must be at most 1.`)
  )

/** Each rule type's numeric fields, named after that rule in messages. */
export const DECISION_RULE_FIELDS = {
  superiority: {
    margin: marginField(DECISION_RULE_LABELS.superiority.margin),
    threshold: thresholdField(DECISION_RULE_LABELS.superiority.threshold)
  },
  futility: {
    margin: marginField(DECISION_RULE_LABELS.futility.margin),
    threshold: thresholdField(DECISION_RULE_LABELS.futility.threshold)
  }
}

/** Any number, for fields with no rules of their own (ordinal outcomes, for now). */
export const anyNumber = finiteNumber

type SampleSizes = { N: number; m0: number; m: number }
type Rule = { type: DecisionRuleType; margin: number; threshold: number }

const ruleOfType = (rules: readonly Rule[], type: DecisionRuleType): Rule | undefined =>
  rules.find((rule) => rule.type === type)

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
  // Shown under the decision rules. A design has a superiority rule, a
  // futility rule, or one of each (the length is checked on its own)
  oneRulePerType: {
    holds: (rules: readonly Rule[]): boolean =>
      new Set(rules.map((rule) => rule.type)).size === rules.length,
    message: 'A design can have only one superiority rule and one futility rule.'
  },
  // Shown under that rule's margin. For an odds ratio,
  // batss-simulation.R takes the log of the margin, so it must be above 0
  oddsRatioMargin: {
    holds: (rule: Rule): boolean => rule.margin > 0,
    message: (rule: Rule): string =>
      `${DECISION_RULE_LABELS[rule.type].margin} must be greater than 0 for an odds ratio.`
  },
  // Shown under the futility cutoff. With the same margin, both rules
  // look at the same posterior probability, so a futility cutoff at or
  // above the superiority cutoff would let one result meet both rules
  cutoffsDoNotOverlap: {
    holds: (rules: readonly Rule[]): boolean => {
      const superiority = ruleOfType(rules, 'superiority')
      const futility = ruleOfType(rules, 'futility')
      if (!superiority || !futility || superiority.margin !== futility.margin) return true
      return futility.threshold < superiority.threshold
    },
    message: `${L.futilityThreshold} must be less than the ${L.superiorityThreshold.toLowerCase()} when both rules use the same margin.`
  }
}
