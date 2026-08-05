import { Field as FormischField, useField } from '@formisch/react'
import { JSX } from 'react'
import { NumberInputField } from '../number-input-field'
import { SimulationFormStore } from '../types'
import { FormSection } from '../form-section'

export function SimulationSettingsSection({ form }: { form: SimulationFormStore }): JSX.Element {
  const N = useField(form, { path: ['N'] })
  const m0 = useField(form, { path: ['m0'] })
  const m = useField(form, { path: ['m'] })
  const R = useField(form, { path: ['R'] })

  return (
    <FormSection
      title="Simulation Settings"
      defaultOpen={false}
      summary={`${N.input ?? '—'} patients · ${m0.input ?? '—'} burn-in · interim every ${m.input ?? '—'} · ${R.input ?? '—'} simulations`}
    >
      <FormischField of={form} path={['N']}>
        {(field) => <NumberInputField id="form-N" label="Maximum sample size" field={field} />}
      </FormischField>

      <FormischField of={form} path={['m0']}>
        {(field) => <NumberInputField id="form-m0" label="Burn-in" field={field} />}
      </FormischField>

      <FormischField of={form} path={['m']}>
        {(field) => (
          <NumberInputField id="form-m" label="Patients between interim analyses" field={field} />
        )}
      </FormischField>

      <FormischField of={form} path={['R']}>
        {(field) => <NumberInputField id="form-r" label="Number of simulations" field={field} />}
      </FormischField>
    </FormSection>
  )
}
