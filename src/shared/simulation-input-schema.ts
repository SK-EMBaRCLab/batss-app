// Checks a run's input in the main process before it reaches R. The
// renderer's form schema already validates what users type; this is the
// main process's own check, so a renderer bug (or a hand-made batch CSV)
// can't send R something it would turn into nonsense results. It only
// accepts what batss-simulation.R actually supports today.
import * as v from 'valibot'

import {
  CORE_PERCENTS,
  CROSS_FIELD_RULES,
  DECISION_RULE_FIELDS,
  NUMBER_FIELDS
} from './design-rules'
import type { SimulationRunInput } from './simulation-types'

// Each field's own rules come from design-rules.ts, shared with the form.
// What's particular to this check is what it won't run yet.

const { oneRulePerType, oddsRatioMargin, cutoffsDoNotOverlap } = CROSS_FIELD_RULES

// A rule's direction isn't listed, so one sent by an older caller is
// dropped: the direction follows the sign of the treatment effect
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ruleOfType = <T extends keyof typeof DECISION_RULE_FIELDS>(type: T) =>
  v.object({
    type: v.literal(type),
    margin: DECISION_RULE_FIELDS[type].margin,
    threshold: DECISION_RULE_FIELDS[type].threshold
  })

const decisionRuleSchema = v.variant(
  'type',
  [ruleOfType('superiority'), ruleOfType('futility')],
  'Decision rules must be superiority or futility rules.'
)

const commonFields = {
  N: NUMBER_FIELDS.N,
  m0: NUMBER_FIELDS.m0,
  m: NUMBER_FIELDS.m,
  R: NUMBER_FIELDS.R,
  // A superiority rule, a futility rule, or one of each
  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'A decision rule is required.'),
    v.maxLength(2, 'A design can have at most two decision rules.'),
    v.check((rules) => oneRulePerType.holds(rules), oneRulePerType.message),
    v.check((rules) => cutoffsDoNotOverlap.holds(rules), cutoffsDoNotOverlap.message)
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
  // Named after the rule whose margin it is
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const failing = dataset.value.decisionRules.find((rule) => !oddsRatioMargin.holds(rule))
    if (failing) addIssue({ message: oddsRatioMargin.message(failing) })
  })
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
