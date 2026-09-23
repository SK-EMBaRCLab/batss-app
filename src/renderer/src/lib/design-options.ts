import { ChartSpline, CircleDot, ListOrdered, type LucideIcon } from 'lucide-react'

export const outcomeTypes: Array<{
  value: 'binary' | 'continuous' | 'ordinal'
  label: string
  icon: LucideIcon
  enabled: boolean
}> = [
  { value: 'binary', label: 'Binary', icon: CircleDot, enabled: true },
  { value: 'continuous', label: 'Continuous', icon: ChartSpline, enabled: true },
  { value: 'ordinal', label: 'Ordinal', icon: ListOrdered, enabled: false }
]

export const treatmentEffects = [
  {
    value: 'oddsRatio',
    label: 'Odds Ratio',
    symbol: 'OR',
    enabled: true,
    description:
      'Compares the odds of experiencing the event between treatment and control groups. An odds ratio of 1 indicates no effect of treatment on the odds of the event; values above 1 increase outcome odds, and values below 1 decrease them'
  },
  {
    value: 'riskDifference',
    label: 'Risk Difference (under development)',
    symbol: 'RD',
    enabled: false,
    description:
      'Compares the probability of experiencing the event between treatment and control groups. A risk difference of 0 indicates no effect of treatment on the event probability; positive values increase the probability of the event, and negative values decrease it'
  },
  {
    value: 'riskRatio',
    label: 'Risk Ratio (under development)',
    symbol: 'RR',
    enabled: false,
    description:
      'Compares the probability of experiencing the event between treatment and control groups. An risk ratio of 1 indicates no effect of treatment on the event probability; values above 1 increase event probability, and values below 1 decrease them'
  }
] as const

export function getTreatmentEffectLabel(
  value: (typeof treatmentEffects)[number]['value'] | undefined
): string {
  return treatmentEffects.find((effect) => effect.value === value)?.label ?? '—'
}
