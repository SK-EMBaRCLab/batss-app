import { Field as FormischField } from '@formisch/react'
import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import { treatmentEffects } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'
import { SelectField } from './select-field'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Binary Outcome Parameters</h3>
      <div className="space-y-6">
        <NumericField
          form={form}
          path={['probability']}
          label={FIELD_LABELS.probability}
          min={0}
          max={1}
          step="0.01"
          className="max-w-lg"
        />

        <FormischField of={form} path={['treatmentEffectType']}>
          {(field) => (
            <SelectField
              field={field}
              label={FIELD_LABELS.treatmentEffectType}
              description="Difference between treatment arm and control arm"
              placeholder="Select effect type"
              options={treatmentEffects}
              className="max-w-lg"
            />
          )}
        </FormischField>
        <NumericField
          form={form}
          path={['treatmentEffect']}
          label={FIELD_LABELS.treatmentEffect}
          className="max-w-lg"
        />
      </div>
    </div>
  )
}
