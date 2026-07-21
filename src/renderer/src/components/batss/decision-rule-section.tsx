import { Field as FormischField } from '@formisch/react'

import { FormSection } from '../form-section'
import { NumberInputField } from '../number-input-field'
import type { JSX } from 'react'
import { BatssFormStore } from '../types'

export function DecisionRuleSection({ form }: { form: BatssFormStore }): JSX.Element {
  return (
    <FormSection title="Decision Rule" description="Define the statistical success criteria.">
      <FormischField of={form} path={['decisionRule', 'deltaEff']}>
        {(field) => (
          <NumberInputField id="form-deltaEff" label="Comparator treatment effect" field={field} />
        )}
      </FormischField>

      <FormischField of={form} path={['decisionRule', 'b']}>
        {(field) => (
          <NumberInputField id="form-b" label="Posterior probability threshold" field={field} />
        )}
      </FormischField>
    </FormSection>
  )
}
