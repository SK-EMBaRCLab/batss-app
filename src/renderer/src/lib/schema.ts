import {
  anyNumber,
  CORE_PERCENTS,
  CROSS_FIELD_RULES,
  DECISION_RULE_TYPES,
  DIRECTIONS,
  NUMBER_FIELDS,
  TREATMENT_EFFECT_TYPES
} from '@shared/design-rules'
import { FIELD_LABELS as L } from '@shared/field-labels'
import { DecisionRule, DesignInput } from '@shared/simulation-types'
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
const decisionRuleSchema = v.object({
  type: v.pipe(
    v.picklist(DECISION_RULE_TYPES, 'Select a decision rule type.'),
    v.check((t) => t === 'superiority', 'Only superiority rules are currently supported.')
  ),

  direction: v.picklist(DIRECTIONS, 'Select greater than or less than.'),

  margin: typed(NUMBER_FIELDS.margin),

  threshold: typed(NUMBER_FIELDS.threshold)
})

const commonDesignFields = {
  N: typed(NUMBER_FIELDS.N),

  m0: typed(NUMBER_FIELDS.m0),

  m: typed(NUMBER_FIELDS.m),

  R: typed(NUMBER_FIELDS.R),

  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'Add at least one decision rule.')
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

const { burnInBelowMaximum, interimFitsAfterBurnIn, oddsRatioMargin } = CROSS_FIELD_RULES

export const designSchema = v.pipe(
  v.variant(
    'outcomeType',
    [binaryDesignSchema, continuousDesignSchema, ordinalDesignSchema],
    'Please select an outcome type.'
  ),
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

  v.forward(
    v.check(
      (data) => data.outcomeType !== 'binary' || oddsRatioMargin.holds(data.decisionRules),
      oddsRatioMargin.message
    ),
    ['decisionRules', 0, 'margin']
  )
)

export const defaultDecisionRule: DecisionRule = {
  type: 'superiority',
  direction: 'greater',
  margin: 1,
  threshold: 0.95
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

  decisionRules: [defaultDecisionRule],

  corePercent: 75
}
