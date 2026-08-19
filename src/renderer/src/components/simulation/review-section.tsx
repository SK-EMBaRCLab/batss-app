import { useField } from '@formisch/react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ReviewSection({ form }: { form: SimulationFormStore }): ReactElement {
  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  const probability = useField(form, {
    path: ['probability']
  })

  const treatmentEffectType = useField(form, {
    path: ['treatmentEffectType']
  })

  const treatmentEffect = useField(form, {
    path: ['treatmentEffect']
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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Review Simulation Design</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcome</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p>Type: {outcomeType.input ?? '-'}</p>

          {probability.input !== undefined && <p>Control probability: {probability.input}</p>}

          {treatmentEffectType.input && (
            <p>
              Treatment effect: {treatmentEffectType.input}
              {' = '}
              {treatmentEffect.input}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Size</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p>Burn-in: {m0.input}</p>

          <p>Patients between interim analyses: {m.input}</p>

          <p>Maximum sample size: {N.input}</p>

          <p>Simulation runs: {R.input}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision Rules</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {(rules.input ?? []).map((rule, index) => (
            <div key={index} className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">
                Rule {index + 1}: {rule.type}
              </div>

              <div className="font-mono">
                P(OR {rule.direction === 'greater' ? '>' : '<'} {rule.margin}){' > '}
                {rule.threshold}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
