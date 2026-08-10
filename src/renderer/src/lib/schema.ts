import { DesignInput } from '@shared/simulation-types'
import * as v from 'valibot'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const requiredNumber = (label: string) =>
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((value) => {
      if (typeof value === 'number') return value

      const trimmed = value.trim()

      if (trimmed === '') {
        return NaN
      }

      return Number(trimmed)
    }),
    v.number(`${label} must be a number.`)
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

export const designSchema = v.pipe(
  v.object({
    /**
     * Outcome definition
     */
    outcomeType: v.optional(
      v.picklist(['binary', 'continuous', 'ordinal'], 'Select an outcome type.')
    ),

    /**
     * Binary outcome fields
     */
    probability: v.optional(
      v.pipe(
        requiredNumber('Control arm probability'),
        v.minValue(0, 'Probability must be at least 0.'),
        v.maxValue(1, 'Probability must be at most 1.')
      )
    ),

    treatmentEffectType: v.optional(v.picklist(['oddsRatio', 'riskDifference', 'riskRatio'])),

    treatmentEffect: v.optional(requiredNumber('Treatment effect')),

    /**
     * Sample size
     */
    N: positiveInteger('Maximum sample size'),

    m0: positiveInteger('Burn-in'),

    m: positiveInteger('Patients between interim analyses'),

    /**
     * Simulation
     */
    R: positiveInteger('Number of simulations'),

    /**
     * Decision rules
     */
    decisionRules: v.array(decisionRuleSchema)
  }),

  /**
   * Cross-field validation
   */
  v.forward(
    v.check((data) => data.N > data.m0, 'Maximum sample size must be greater than burn-in.'),
    ['N']
  )
)

export const runnableDesignSchema = v.object({
  outcomeType: v.picklist(['binary', 'continuous', 'ordinal']),

  probability: v.number(),

  treatmentEffectType: v.picklist(['oddsRatio', 'riskDifference', 'riskRatio']),

  treatmentEffect: v.number(),

  N: positiveInteger('Maximum sample size'),

  m0: positiveInteger('Burn-in'),

  m: positiveInteger('Patients between interim analyses'),

  R: positiveInteger('Number of simulations'),

  decisionRules: v.array(decisionRuleSchema)
})

export const initialDesignInput: DesignInput = {
  outcomeType: undefined,

  probability: undefined,

  treatmentEffectType: undefined,
  treatmentEffect: undefined,

  N: 216,
  m0: 60,
  m: 12,

  R: 10,

  decisionRules: []
}
