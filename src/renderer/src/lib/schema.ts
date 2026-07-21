import * as v from 'valibot'

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

export const designSchema = v.object({
  primaryOutcome: v.picklist(['A', 'B'], 'Please select A (positive) or B (negative).'),

  probability: v.pipe(
    requiredNumber('Probability'),
    v.minValue(0, 'Probability must be at least 0.'),
    v.maxValue(1, 'Probability must be at most 1.')
  ),

  logOdds: requiredNumber('logOdds'),

  decisionRule: v.object({
    deltaEff: requiredNumber('Delta efficiency'),
    b: requiredNumber('b')
  }),

  N: v.pipe(requiredNumber('Maximum sample size'), v.integer(), v.minValue(1), v.maxValue(1000)),

  m0: v.pipe(requiredNumber('Burn-in'), v.integer(), v.minValue(1)),

  m: v.pipe(requiredNumber('Patients between interim analyses'), v.integer(), v.minValue(1)),

  R: v.pipe(requiredNumber('Number of simulations'), v.integer(), v.minValue(1))
})

export const initialDesignInput = {
  primaryOutcome: 'A',
  probability: 0.1,
  logOdds: 0.2,

  decisionRule: {
    deltaEff: 0.05,
    b: 0.2
  },

  N: 216,
  m0: 60,
  m: 12,
  R: 3
} as const
