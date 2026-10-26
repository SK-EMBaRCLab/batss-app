import { Field as FormischField } from '@formisch/react'
import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement, useId } from 'react'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { treatmentEffects } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

import { useFormLocked } from './form-locked'
import { NumericField } from './numeric-field'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  const locked = useFormLocked()
  const labelId = useId()
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
          {(field) => {
            const selectedTreatmentEffect = treatmentEffects.find(
              (effect) => effect.value === field.input
            )

            return (
              <Field data-invalid={field.errors !== null} className="max-w-lg">
                <FieldLabel id={labelId}>{FIELD_LABELS.treatmentEffectType}</FieldLabel>
                <FieldDescription>
                  Difference between treatment arm and control arm
                </FieldDescription>

                <Select
                  disabled={locked}
                  value={field.input ?? ''}
                  onValueChange={(value) => {
                    if (
                      value === 'oddsRatio' ||
                      value === 'riskDifference' ||
                      value === 'riskRatio'
                    ) {
                      field.onChange(value)
                    }
                  }}
                >
                  <SelectTrigger aria-labelledby={labelId}>
                    <SelectValue placeholder="Select effect type">
                      {selectedTreatmentEffect?.label}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {treatmentEffects.map((effect) => (
                      <SelectItem
                        key={effect.value}
                        value={effect.value}
                        disabled={!effect.enabled}
                      >
                        {effect.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.errors && (
                  <FieldError
                    errors={field.errors.map((message) => ({
                      message
                    }))}
                  />
                )}
              </Field>
            )
          }}
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
