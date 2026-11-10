import { DEFAULT_CORE_PERCENT } from '@shared/cores'
import {
  anyNumber,
  CORE_PERCENTS,
  CROSS_FIELD_RULES,
  DECISION_RULE_FIELDS,
  NUMBER_FIELDS,
  TREATMENT_EFFECT_TYPES
} from '@shared/design-rules'
import { FIELD_LABELS as L } from '@shared/field-labels'
import { DecisionRule, DesignInput, OutcomeType } from '@shared/simulation-types'
import * as v from 'valibot'

// The simulation form's check. Each field's rules (and the rules between
// fields) come from shared/design-rules.ts, the same ones the main process
// checks before a run, so they're reported while typing rather than only
// when Run is clicked. What's particular to the form: values arrive as
// typed text, messages prompt for a choice, and it accepts some designs
// that can be saved but not run yet (see the "currently supported" checks).

// What's typed, as a number for the shared rules (NaN if empty, which
// they report as "must be a number")
const fromText = v.pipe(
  v.union([v.string(), v.number(), v.undefined()]),
  v.transform((value): number => {
    if (value === undefined) return NaN
    if (typeof value === 'number') return value

    const trimmed = value.trim()
    return trimmed === '' ? NaN : Number(trimmed)
  })
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const typed = (rules: v.GenericSchema<number>) => v.pipe(fromText, rules)

/**
 * Decision rules
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ruleOfType = <T extends keyof typeof DECISION_RULE_FIELDS>(type: T) =>
  v.object({
    type: v.literal(type),

    // A direction from an older design isn't listed, so it's dropped: it
    // now follows the sign of the treatment effect (shared/effect-direction.ts)
    margin: typed(DECISION_RULE_FIELDS[type].margin),

    threshold: typed(DECISION_RULE_FIELDS[type].threshold)
  })

const decisionRuleSchema = v.variant(
  'type',
  [ruleOfType('superiority'), ruleOfType('futility')],
  'Select a decision rule type.'
)

const commonDesignFields = {
  N: typed(NUMBER_FIELDS.N),

  m0: typed(NUMBER_FIELDS.m0),

  m: typed(NUMBER_FIELDS.m),

  R: typed(NUMBER_FIELDS.R),

  // A superiority rule, a futility rule, or one of each
  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'Add at least one decision rule.'),
    v.maxLength(2, 'A design can have at most two decision rules.'),
    v.check(
      (rules) => CROSS_FIELD_RULES.oneRulePerType.holds(rules),
      CROSS_FIELD_RULES.oneRulePerType.message
    )
  ),

  corePercent: v.optional(v.picklist(CORE_PERCENTS, 'Select a core usage percentage.'))
}

const binaryDesignSchema = v.object({
  outcomeType: v.literal('binary'),

  probability: typed(NUMBER_FIELDS.probability),

  treatmentEffectType: v.pipe(
    v.picklist(TREATMENT_EFFECT_TYPES, 'Please select a treatment effect.'),
    v.check((t) => t === 'oddsRatio', 'Only odds ratio is currently supported.')
  ),

  treatmentEffect: typed(NUMBER_FIELDS.treatmentEffect),

  ...commonDesignFields
})

const continuousDesignSchema = v.object({
  outcomeType: v.literal('continuous'),

  meanOutcome: typed(NUMBER_FIELDS.meanOutcome),

  meanDiff: typed(NUMBER_FIELDS.meanDiff),

  sd: typed(NUMBER_FIELDS.sd),

  ...commonDesignFields
})

// Can't be picked yet (the option is disabled), so only basic checks
const ordinalDesignSchema = v.object({
  outcomeType: v.literal('ordinal'),

  probability: typed(anyNumber(L.probability)),

  treatmentEffectType: v.picklist(TREATMENT_EFFECT_TYPES, 'Please select a treatment effect.'),

  treatmentEffect: typed(anyNumber(L.treatmentEffect)),

  ...commonDesignFields
})

const { burnInBelowMaximum, interimFitsAfterBurnIn, oddsRatioMargin, cutoffsDoNotOverlap } =
  CROSS_FIELD_RULES

type DesignOutput = v.InferOutput<typeof designVariants>
type RuleOutput = DesignOutput['decisionRules'][number]

const designVariants = v.variant(
  'outcomeType',
  [binaryDesignSchema, continuousDesignSchema, ordinalDesignSchema],
  'Please select an outcome type.'
)

const ruleAt = (data: DesignOutput, index: number): RuleOutput | undefined =>
  data.decisionRules[index]

// A design has at most two rules, so each check shown under a rule's own
// field is added for both places the rule can be

// Under the margin of the rule it's about
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const marginCheckAt = (index: 0 | 1) =>
  v.forward(
    v.check(
      (data: DesignOutput) => {
        const rule = ruleAt(data, index)
        return data.outcomeType !== 'binary' || !rule || oddsRatioMargin.holds(rule)
      },
      (issue) => oddsRatioMargin.message(ruleAt(issue.input, index)!)
    ),
    ['decisionRules', index, 'margin']
  )

// Under the futility rule's cutoff
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const cutoffCheckAt = (index: 0 | 1) =>
  v.forward(
    v.check(
      (data: DesignOutput) =>
        ruleAt(data, index)?.type !== 'futility' || cutoffsDoNotOverlap.holds(data.decisionRules),
      cutoffsDoNotOverlap.message
    ),
    ['decisionRules', index, 'threshold']
  )

export const designSchema = v.pipe(
  designVariants,
  /**
   * Cross-field validation, each shown under one field
   */
  v.forward(
    v.check((data) => burnInBelowMaximum.holds(data), burnInBelowMaximum.message),
    ['N']
  ),

  v.forward(
    v.check((data) => interimFitsAfterBurnIn.holds(data), interimFitsAfterBurnIn.message),
    ['m']
  ),

  marginCheckAt(0),
  marginCheckAt(1),
  cutoffCheckAt(0),
  cutoffCheckAt(1)
)

/**
 * A new rule's values. The margin is "no effect" on the outcome's scale
 * (an odds ratio of 1, a mean difference of 0); the cutoffs are the
 * common 0.95 for superiority and 0.05 for futility.
 */
export function defaultDecisionRule(
  type: DecisionRule['type'],
  outcomeType: OutcomeType | undefined
): DecisionRule {
  return {
    type,
    margin: outcomeType === 'continuous' ? 0 : 1,
    threshold: type === 'superiority' ? 0.95 : 0.05
  }
}

export const initialDesignInput: DesignInput = {
  outcomeType: undefined,

  // Binary
  probability: undefined,
  treatmentEffectType: undefined,
  treatmentEffect: undefined,

  // Continuous
  meanOutcome: undefined,
  meanDiff: undefined,
  sd: undefined,

  N: 216,
  m0: 60,
  m: 12,

  R: 10,

  // Added with the decision rules step's buttons; at least one is needed
  decisionRules: [],

  corePercent: DEFAULT_CORE_PERCENT
}
