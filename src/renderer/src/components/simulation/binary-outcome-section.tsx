import { Field as FormischField, useField } from '@formisch/react'
import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import { getTreatmentEffectValueLabel, treatmentEffects } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'
import { SelectField } from './select-field'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  // Shown once an effect is chosen, labelled by it (e.g. "Odds ratio")
  const valueLabel = getTreatmentEffectValueLabel(treatmentEffectType.input)

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
        {valueLabel && (
          <NumericField
            form={form}
            path={['treatmentEffect']}
            label={valueLabel}
            className="max-w-lg"
          />
        )}
      </div>
    </div>
  )
}
