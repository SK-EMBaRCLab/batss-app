import { DecisionRule, DesignInput } from '@shared/simulation-types'
import * as v from 'valibot'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const requiredNumber = (label: string) =>
  v.pipe(
    v.union([v.string(), v.number(), v.undefined()]),
    v.transform((value) => {
      if (value === undefined) {
        return NaN
      }
      if (typeof value === 'number') return value

      const trimmed = value.trim()

      if (trimmed === '') {
        return NaN
      }

      return Number(trimmed)
    }),
    v.number(`${label} must be a number.`),
    v.finite(`${label} must be a finite number.`)
  )

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const positiveInteger = (label: string) =>
  v.pipe(
    requiredNumber(label),
    v.integer(`${label} must be a whole number.`),
    v.minValue(1, `${label} must be greater than 0.`)
  )
/**
 * Decision rules
 */
const decisionRuleSchema = v.object({
  type: v.picklist(['superiority', 'futility'], 'Select a decision rule type.'),

  direction: v.picklist(['greater', 'less'], 'Select greater than or less than.'),

  margin: v.pipe(requiredNumber('Superiority margin'), v.minValue(0, 'Margin must be positive.')),

  threshold: v.pipe(
    requiredNumber('Decision threshold'),
    v.minValue(0, 'Threshold must be at least 0.'),
    v.maxValue(1, 'Threshold must be at most 1.')
  )
})

const commonDesignFields = {
  N: positiveInteger('Maximum sample size'),

  m0: positiveInteger('Burn-in'),

  m: positiveInteger('Patients between interim analyses'),

  R: positiveInteger('Number of simulated trials'),

  decisionRules: v.pipe(
    v.array(decisionRuleSchema),
    v.minLength(1, 'Add at least one decision rule.')
  )
}

const binaryDesignSchema = v.object({
  outcomeType: v.literal('binary'),

  probability: v.pipe(
    requiredNumber('Control arm event probability'),
    v.gtValue(0, 'Probability must be greater than 0.'),
    v.ltValue(1, 'Probability must be less than 1.')
  ),

  treatmentEffectType: v.pipe(
    v.picklist(['oddsRatio', 'riskDifference', 'riskRatio'], 'Please select a treatment effect.'),
    v.check((t) => t === 'oddsRatio', 'Only odds ratio is currently supported.')
  ),

  treatmentEffect: v.pipe(
    requiredNumber('Treatment effect'),
    v.gtValue(0, 'Odds ratio must be greater than 0.')
  ),

  ...commonDesignFields
})

const continuousDesignSchema = v.object({
  outcomeType: v.literal('continuous'),

  meanOutcome: requiredNumber('Mean outcome in control arm'),

  meanDiff: requiredNumber('Mean difference for the treatment effect'),

  sd: v.pipe(
    requiredNumber('Standard deviation'),
    v.gtValue(0, 'Standard deviation must be greater than 0.')
  ),

  ...commonDesignFields
})

const ordinalDesignSchema = v.object({
  outcomeType: v.literal('ordinal'),

  probability: requiredNumber('Control arm probability'),

  treatmentEffectType: v.picklist(
    ['oddsRatio', 'riskDifference', 'riskRatio'],
    'Please select a treatment effect.'
  ),

  treatmentEffect: requiredNumber('Treatment effect'),

  ...commonDesignFields
})

export const designSchema = v.pipe(
  v.variant(
    'outcomeType',
    [binaryDesignSchema, continuousDesignSchema, ordinalDesignSchema],
    'Please select an outcome type.'
  ),
  /**
   * Cross-field validation
   */
  v.forward(
    v.check((data) => data.N > data.m0, 'Maximum sample size must be greater than burn-in.'),
    ['N']
  ),

  v.forward(
    v.check(
      (data) => data.m < data.N - data.m0,
      'Number of intermim patients must be less than the difference between max sample size and burn-in'
    ),
    ['m']
  ),

  v.forward(
    v.check(
      (data) => data.outcomeType !== 'binary' || data.decisionRules.every((r) => r.margin > 0),
      'Superiority margin must be greater than 0 for an odds ratio.'
    ),
    ['decisionRules', 0, 'margin']
  )
)

const runnableCommonSchema = {
  N: positiveInteger('Maximum sample size'),

  m0: positiveInteger('Burn-in'),

  m: positiveInteger('Patients between interim analyses'),

  R: positiveInteger('Number of simulations'),

  decisionRules: v.array(decisionRuleSchema)
}

const runnableBinarySchema = v.object({
  outcomeType: v.literal('binary'),

  probability: v.number(),

  treatmentEffectType: v.picklist(['oddsRatio', 'riskDifference', 'riskRatio']),

  treatmentEffect: v.number(),

  ...runnableCommonSchema
})

const runnableContinuousSchema = v.object({
  outcomeType: v.literal('continuous'),

  meanOutcome: v.number(),

  meanDiff: v.number(),

  sd: v.pipe(v.number(), v.minValue(0, 'Standard deviation must be greater than 0.')),

  ...runnableCommonSchema
})

const runnableOrdinalSchema = v.object({
  outcomeType: v.literal('ordinal'),

  // Add ordinal-specific fields here

  ...runnableCommonSchema
})

export const runnableDesignSchema = v.variant('outcomeType', [
  runnableBinarySchema,
  runnableContinuousSchema,
  runnableOrdinalSchema
])

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

  decisionRules: [defaultDecisionRule]
}
