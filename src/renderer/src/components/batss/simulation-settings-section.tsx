import { getInput, Field as FormischField } from '@formisch/react'
import { JSX } from 'react'
import { NumberInputField } from '../number-input-field'
import { BatssFormStore } from '../types'
import { FormSection } from '../form-section'

export function SimulationSettingsSection({ form }: { form: BatssFormStore }): JSX.Element {
  const N = getInput(form, { path: ['N'] }) as number | undefined
  const m0 = getInput(form, { path: ['m0'] }) as number | undefined
  const m = getInput(form, { path: ['m'] }) as number | undefined
  const R = getInput(form, { path: ['R'] }) as number | undefined

  return (
    <FormSection
      title="Simulation Settings"
      defaultOpen={false}
      summary={`${N} patients · ${m0} burn-in · interim every ${m} · ${R} simulations`}
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
