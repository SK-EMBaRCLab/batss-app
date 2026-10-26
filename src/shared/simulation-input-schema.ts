// Checks a run's input in the main process before it reaches R. The
// renderer's form schema already validates what users type; this is the
// main process's own check, so a renderer bug (or a hand-made batch CSV)
// can't send R something it would turn into nonsense results. It only
// accepts what batss-simulation.R actually supports today.
import * as v from 'valibot'

import { FIELD_LABELS as L } from './field-labels'
import type { SimulationRunInput } from './simulation-types'

// Upper limits, far above any real design (the largest runs so far are
// N≈200 and R=1,000), so a typo or a bad CSV can't tie R up for hours or
// build an input too large to hand to R
export const MAX_SAMPLE_SIZE = 100_000
export const MAX_SIMULATED_TRIALS = 100_000
export const MAX_BATCH_ROWS = 500

const positiveInteger = (label: string, max: number): v.GenericSchema<number> =>
  v.pipe(
    v.number(`${label} must be a number.`),
    v.integer(`${label} must be a whole number.`),
    v.minValue(1, `${label} must be greater than 0.`),
    v.maxValue(max, `${label} must be at most ${max.toLocaleString('en-CA')}.`)
  )

const finiteNumber = (label: string): v.GenericSchema<number> =>
  v.pipe(v.number(`${label} must be a number.`), v.finite(`${label} must be a finite number.`))

const decisionRuleSchema = v.object({
  // batss-simulation.R has no futility arm yet, and would treat a
  // futility rule as a superiority one
  type: v.literal('superiority', 'Only superiority decision rules are supported.'),
  direction: v.picklist(['greater', 'less'], 'Decision rule direction must be greater or less.'),
  margin: finiteNumber(L.margin),
  threshold: v.pipe(
    finiteNumber(L.threshold),
    v.minValue(0, `${L.threshold} must be at least 0.`),
    v.maxValue(1, `${L.threshold} must be at most 1.`)
  )
})

const commonFields = {
  N: positiveInteger(L.N, MAX_SAMPLE_SIZE),
  m0: positiveInteger(L.m0, MAX_SAMPLE_SIZE),
  m: positiveInteger(L.m, MAX_SAMPLE_SIZE),
  R: positiveInteger(L.R, MAX_SIMULATED_TRIALS),
  // Only the first rule is used by batss-simulation.R
  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'A decision rule is required.'),
    v.maxLength(1, 'Only one decision rule is supported.')
  ),
  corePercent: v.optional(v.picklist([25, 50, 75, 100], 'Core usage must be 25, 50, 75 or 100%.'))
}

const binaryInputSchema = v.pipe(
  v.object({
    outcomeType: v.literal('binary'),
    probability: v.pipe(
      finiteNumber(L.probability),
      v.gtValue(0, `${L.probability} must be greater than 0.`),
      v.ltValue(1, `${L.probability} must be less than 1.`)
    ),
    // The R script always does odds-ratio maths (log of the effect and
    // margin), so the other effect types would give wrong results
    treatmentEffectType: v.literal(
      'oddsRatio',
      'Only the odds ratio treatment effect is supported.'
    ),
    treatmentEffect: v.pipe(
      finiteNumber(L.treatmentEffect),
      v.gtValue(0, `${L.treatmentEffect} (odds ratio) must be greater than 0.`)
    ),
    ...commonFields
  }),
  v.check(
    (input) => input.decisionRules.every((rule) => rule.margin > 0),
    `${L.margin} must be greater than 0 for an odds ratio.`
  )
)

const continuousInputSchema = v.object({
  outcomeType: v.literal('continuous'),
  meanOutcome: finiteNumber(L.meanOutcome),
  meanDiff: finiteNumber(L.meanDiff),
  sd: v.pipe(finiteNumber(L.sd), v.gtValue(0, `${L.sd} must be greater than 0.`)),
  ...commonFields
})

const simulationRunInputSchema = v.pipe(
  v.variant(
    'outcomeType',
    [binaryInputSchema, continuousInputSchema],
    'Only binary and continuous outcomes are supported.'
  ),
  v.check((input) => input.m0 < input.N, `${L.m0} must be smaller than the ${L.N.toLowerCase()}.`),
  v.check((input) => input.m <= input.N, `${L.m} must be at most the ${L.N.toLowerCase()}.`)
)

export type SimulationRunInputCheck =
  { success: true; input: SimulationRunInput } | { success: false; message: string }

export function checkSimulationRunInput(data: unknown): SimulationRunInputCheck {
  const result = v.safeParse(simulationRunInputSchema, data)

  if (result.success) {
    return { success: true, input: result.output as SimulationRunInput }
  }

  return {
    success: false,
    message: `These simulation settings can't be run: ${result.issues[0].message}`
  }
}
