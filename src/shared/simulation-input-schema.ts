// Checks a run's input in the main process before it reaches R. The
// renderer's form schema already validates what users type; this is the
// main process's own check, so a renderer bug (or a hand-made batch CSV)
// can't send R something it would turn into nonsense results. It only
// accepts what batss-simulation.R actually supports today.
import * as v from 'valibot'

import { CORE_PERCENTS, CROSS_FIELD_RULES, DIRECTIONS, NUMBER_FIELDS } from './design-rules'
import type { SimulationRunInput } from './simulation-types'

// Each field's own rules come from design-rules.ts, shared with the form.
// What's particular to this check is what it won't run yet.

const decisionRuleSchema = v.object({
  // batss-simulation.R has no futility arm yet, and would treat a
  // futility rule as a superiority one
  type: v.literal('superiority', 'Only superiority decision rules are supported.'),
  direction: v.picklist(DIRECTIONS, 'Decision rule direction must be greater or less.'),
  margin: NUMBER_FIELDS.margin,
  threshold: NUMBER_FIELDS.threshold
})

const commonFields = {
  N: NUMBER_FIELDS.N,
  m0: NUMBER_FIELDS.m0,
  m: NUMBER_FIELDS.m,
  R: NUMBER_FIELDS.R,
  // Only the first rule is used by batss-simulation.R
  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'A decision rule is required.'),
    v.maxLength(1, 'Only one decision rule is supported.')
  ),
  corePercent: v.optional(v.picklist(CORE_PERCENTS, 'Core usage must be 25, 50, 75 or 100%.'))
}

const binaryInputSchema = v.pipe(
  v.object({
    outcomeType: v.literal('binary'),
    probability: NUMBER_FIELDS.probability,
    // The R script always does odds-ratio maths (log of the effect and
    // margin), so the other effect types would give wrong results
    treatmentEffectType: v.literal(
      'oddsRatio',
      'Only the odds ratio treatment effect is supported.'
    ),
    treatmentEffect: NUMBER_FIELDS.treatmentEffect,
    ...commonFields
  }),
  v.check(
    (input) => CROSS_FIELD_RULES.oddsRatioMargin.holds(input.decisionRules),
    CROSS_FIELD_RULES.oddsRatioMargin.message
  )
)

const continuousInputSchema = v.object({
  outcomeType: v.literal('continuous'),
  meanOutcome: NUMBER_FIELDS.meanOutcome,
  meanDiff: NUMBER_FIELDS.meanDiff,
  sd: NUMBER_FIELDS.sd,
  ...commonFields
})

const { burnInBelowMaximum, interimFitsAfterBurnIn } = CROSS_FIELD_RULES

const simulationRunInputSchema = v.pipe(
  v.variant(
    'outcomeType',
    [binaryInputSchema, continuousInputSchema],
    'Only binary and continuous outcomes are supported.'
  ),
  v.check((input) => burnInBelowMaximum.holds(input), burnInBelowMaximum.message),
  v.check((input) => interimFitsAfterBurnIn.holds(input), interimFitsAfterBurnIn.message)
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
