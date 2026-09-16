import { useField } from '@formisch/react'
import { Fragment, type ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { decisionRuleFormula } from '@/lib/utils'
import type { SimulationFormStore } from '@/types/form-types'

import { getTreatmentEffectLabel } from './utils'

type ReviewItem = [label: string, value: string | number | null | undefined]

const descriptionListClassName = 'grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(12rem,auto)_1fr]'

function ReviewList({ items }: { items: ReviewItem[] }): ReactElement {
  return (
    <dl className={descriptionListClassName}>
      {items.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd>{value ?? '-'}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

function OutcomeSummary({ form }: { form: SimulationFormStore }): ReactElement | null {
  const outcomeType = useField(form, { path: ['outcomeType'] })
  const probability = useField(form, { path: ['probability'] })
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  const treatmentEffect = useField(form, { path: ['treatmentEffect'] })
  const meanOutcome = useField(form, { path: ['meanOutcome'] })
  const sd = useField(form, { path: ['sd'] })
  const meanDiff = useField(form, { path: ['meanDiff'] })

  const items: ReviewItem[] | null =
    outcomeType.input === 'binary'
      ? [
          ['Type', outcomeType.input],
          ['Control arm event probability', probability.input],
          ['Treatment effect', getTreatmentEffectLabel(treatmentEffectType.input)],
          ['Treatment effect value', treatmentEffect.input]
        ]
      : outcomeType.input === 'continuous'
        ? [
            ['Type', outcomeType.input],
            ['Mean Outcome in Control arm', meanOutcome.input],
            ['Standard Deviation of Outcome', sd.input],
            ['Mean Difference for the treatment effect', meanDiff.input]
          ]
        : null

  if (!items) return null

  return <ReviewList items={items} />
}

export function ReviewSection({ form }: { form: SimulationFormStore }): ReactElement {
  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  const treatmentEffectType = useField(form, {
    path: ['treatmentEffectType']
  })

  const N = useField(form, {
    path: ['N']
  })

  const m0 = useField(form, {
    path: ['m0']
  })

  const m = useField(form, {
    path: ['m']
  })

  const R = useField(form, {
    path: ['R']
  })

  const rules = useField(form, {
    path: ['decisionRules']
  })

  const rule = rules.input[0]

  let formula = ''

  if (outcomeType.input === 'binary') {
    formula = decisionRuleFormula({
      ...rule,
      treatmentEffectType: treatmentEffectType.input
    })
  } else if (outcomeType.input === 'continuous') {
    formula = decisionRuleFormula({
      ...rule,
      treatmentEffectType: 'meanDifference'
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Review Simulation Design</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcome Parameters</CardTitle>
        </CardHeader>

        <CardContent className="text-sm">
          <OutcomeSummary form={form} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Size</CardTitle>
        </CardHeader>

        <CardContent className="text-sm">
          <ReviewList
            items={[
              ['Burn-in', m0.input],
              ['Patients between interim analyses', m.input],
              ['Maximum sample size', N.input],
              ['Number of simulated trials', R.input]
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision Rules</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="font-medium">Rule 1: {rule.type}</div>
            <div className="font-mono">{formula}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
