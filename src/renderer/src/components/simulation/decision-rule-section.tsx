import { Field as FormischField, useField } from '@formisch/react'

import { FormSection } from '../form-section'
import { NumberInputField } from '../number-input-field'
import type { JSX } from 'react'
import { SimulationFormStore } from '../types'

export function DecisionRuleSection({ form }: { form: SimulationFormStore }): JSX.Element {
  const deltaEff = useField(form, { path: ['deltaEff'] })
  const b = useField(form, { path: ['b'] })

  return (
    <FormSection
      title="Decision Rule"
      description="Define the statistical success criteria."
      summary={`Declare superiority if P(Δ > ${deltaEff.input ?? '—'}) ≥ ${b.input ?? '—'}`}
    >
      <FormischField of={form} path={['deltaEff']}>
        {(field) => (
          <NumberInputField id="form-deltaEff" label="Comparator treatment effect" field={field} />
        )}
      </FormischField>

      <FormischField of={form} path={['b']}>
        {(field) => (
          <NumberInputField id="form-b" label="Posterior probability threshold" field={field} />
        )}
      </FormischField>
    </FormSection>
  )
}
