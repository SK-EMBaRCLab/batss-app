import { type ReactElement } from 'react'
import { Field as FormischField } from '@formisch/react'

import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'

import { Input } from '@/components/ui/input'

import type { SimulationFormStore } from '@/components/types'

export function ContinuousOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Continuous Outcome Parameters</h3>

      <FormischField of={form} path={['meanOutcome']}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel>Mean Outcome in Control arm</FieldLabel>
            <FieldDescription>TODO</FieldDescription>
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

      <FormischField of={form} path={['sd']}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel>Standard Deviation of Outcome</FieldLabel>
            <FieldDescription>TODO</FieldDescription>
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

      <FormischField of={form} path={['meanDiff']}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel>Mean Difference for the treatment effect</FieldLabel>
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
