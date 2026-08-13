import { type ReactElement } from 'react'
import { Field as FormischField } from '@formisch/react'

import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import type { SimulationFormStore } from '@/components/types'
import { treatmentEffects } from './utils'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Binary Outcome Parameters</h3>

      <FormischField of={form} path={['probability']}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel>Control arm probability</FieldLabel>
            <FieldDescription>Probability of response</FieldDescription>
            <Input
              {...field.props}
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={field.input ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />

            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </Field>
        )}
      </FormischField>

      <FormischField of={form} path={['treatmentEffectType']}>
        {(field) => (
          <Field>
            <FieldLabel>Treatment effect</FieldLabel>
            <FieldDescription>Difference betweeen treatment arm and control arm</FieldDescription>
            <Select
              value={field.input ?? ''}
              onValueChange={(value) => {
                if (value === 'oddsRatio' || value === 'riskDifference' || value === 'riskRatio') {
                  field.onChange(value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select effect type" />
              </SelectTrigger>

              <SelectContent>
                {treatmentEffects.map((effect) => (
                  <SelectItem key={effect.value} value={effect.value}>
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
        )}
      </FormischField>

      <FormischField of={form} path={['treatmentEffect']}>
        {(field) => (
          <Field>
            <FieldLabel>Treatment effect value</FieldLabel>
            <FieldDescription>Describe this</FieldDescription>
            <Input
              {...field.props}
              type="number"
              value={field.input ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </Field>
        )}
      </FormischField>
    </div>
  )
}
