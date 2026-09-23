import { useField } from '@formisch/react'
import { Fragment, type ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { decisionRuleSummary, type DesignSnapshot, fieldsFor } from '@/lib/design-fields'
import type { SimulationFormStore } from '@/types/form-types'

type ReviewItem = [label: string, value: string | number | undefined]

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

export function ReviewSection({ form }: { form: SimulationFormStore }): ReactElement {
  const outcomeType = useField(form, { path: ['outcomeType'] })
  const probability = useField(form, { path: ['probability'] })
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  const treatmentEffect = useField(form, { path: ['treatmentEffect'] })
  const meanOutcome = useField(form, { path: ['meanOutcome'] })
  const sd = useField(form, { path: ['sd'] })
  const meanDiff = useField(form, { path: ['meanDiff'] })
  const N = useField(form, { path: ['N'] })
  const m0 = useField(form, { path: ['m0'] })
  const m = useField(form, { path: ['m'] })
  const R = useField(form, { path: ['R'] })
  const rules = useField(form, { path: ['decisionRules'] })

  const rule = rules.input[0]

  const snapshot: DesignSnapshot = {
    outcomeType: outcomeType.input,
    probability: probability.input,
    treatmentEffectType: treatmentEffectType.input,
    treatmentEffect: treatmentEffect.input,
    meanOutcome: meanOutcome.input,
    sd: sd.input,
    meanDiff: meanDiff.input,
    N: N.input,
    m0: m0.input,
    m: m.input,
    R: R.input,
    decisionRules: rule ? [rule] : []
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Review Simulation Design</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcome Parameters</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ReviewList
            items={fieldsFor(outcomeType.input, 'outcome').map((field): ReviewItem => [
              field.label,
              field.value(snapshot)
            ])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Size</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ReviewList
            items={[
              ...fieldsFor(outcomeType.input, 'sampleSize'),
              ...fieldsFor(outcomeType.input, 'simulation')
            ].map((field): ReviewItem => [field.label, field.value(snapshot)])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="font-medium">Rule 1: {rule?.type}</div>
            <div className="font-mono">{decisionRuleSummary(snapshot)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
