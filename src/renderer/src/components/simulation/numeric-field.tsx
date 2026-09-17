import { Field as FormischField } from '@formisch/react'
import { type ComponentProps, type ReactElement } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SimulationFormStore } from '@/types/form-types'

type NumericFieldPath =
  | ['N']
  | ['m0']
  | ['m']
  | ['R']
  | ['probability']
  | ['treatmentEffect']
  | ['meanOutcome']
  | ['meanDiff']
  | ['sd']

type NumericFieldProps = {
  form: SimulationFormStore
  path: NumericFieldPath
  label: string
  className?: string
} & Omit<ComponentProps<typeof Input>, 'form' | 'type' | 'value' | 'onChange'>

export function NumericField({
  form,
  path,
  label,
  className,
  ...inputProps
}: NumericFieldProps): ReactElement {
  return (
    <FormischField of={form} path={path}>
      {(field) => (
        <Field data-invalid={field.errors !== null} className={className}>
          <FieldLabel>{label}</FieldLabel>

          <Input
            {...field.props}
            {...inputProps}
            type="number"
            value={field.input ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
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
  )
}
