import { getDeepErrorEntries } from '@formisch/react'

import { designSchema } from '@/lib/schema'

type ErrorEntry = ReturnType<typeof getDeepErrorEntries<typeof designSchema>>[number]

export const treatmentEffects = [
  {
    value: 'oddsRatio',
    label: 'Odds Ratio',
    symbol: 'OR',
    description:
      'Compares the odds of experiencing the event between treatment and control groups. An odds ratio of 1 indicates no effect of treatment on the odds of the event; values above 1 increase outcome odds, and values below 1 decrease them'
  },
  {
    value: 'riskDifference',
    label: 'Risk Difference',
    symbol: 'RD',
    description:
      'Compares the probability of experiencing the event between treatment and control groups. A risk difference of 0 indicates no effect of treatment on the event probability; positive values increase the probability of the event, and negative values decrease it'
  },
  {
    value: 'riskRatio',
    label: 'Risk Ratio',
    symbol: 'RR',
    description:
      'Compares the probability of experiencing the event between treatment and control groups. An risk ratio of 1 indicates no effect of treatment on the event probability; values above 1 increase event probability, and values below 1 decrease them'
  }
] as const

export function getTreatmentEffectLabel(
  value: (typeof treatmentEffects)[number]['value'] | undefined
): string {
  return treatmentEffects.find((effect) => effect.value === value)?.label ?? '-'
}

export function hasFieldError(errors: ErrorEntry[], path: string): boolean {
  return errors.some((error) => error.path.length === 1 && error.path[0] === path)
}

export function hasAnyFieldError(errors: ErrorEntry[], paths: string[]): boolean {
  return paths.some((path) => hasFieldError(errors, path))
}
