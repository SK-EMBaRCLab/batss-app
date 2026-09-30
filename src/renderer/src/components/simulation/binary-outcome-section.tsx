import { Field as FormischField } from '@formisch/react'
import { type ReactElement } from 'react'

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

import { NumericField } from './numeric-field'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Binary Outcome Parameters</h3>
      <div className="space-y-6">
        <NumericField
          form={form}
          path={['probability']}
          label="Control arm event probability"
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
                <FieldLabel>Treatment effect</FieldLabel>
                <FieldDescription>
                  Difference betweeen treatment arm and control arm
                </FieldDescription>

                <Select
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
                  <SelectTrigger>
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
          label="Treatment effect value"
          className="max-w-lg"
        />
      </div>
    </div>
  )
}
