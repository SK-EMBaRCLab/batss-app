import { Field as FormischField } from '@formisch/react'
import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import { outcomeTypes, upcomingOutcomeTypes } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

import { SelectField } from './select-field'

export function OutcomeTypeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <FormischField of={form} path={['outcomeType']}>
      {(field) => (
        <SelectField
          field={field}
          label={FIELD_LABELS.outcomeType}
          description="Select the outcome type that matches your primary study endpoint"
          placeholder="Select outcome type"
          options={outcomeTypes}
          upcoming={upcomingOutcomeTypes}
          className="max-w-lg"
        />
      )}
    </FormischField>
  )
}
