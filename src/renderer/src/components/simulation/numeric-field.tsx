import { Field as FormischField } from '@formisch/react'
import { type ComponentProps, type ReactElement, useId } from 'react'

import { FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SimulationFormStore } from '@/types/form-types'

import { ValidatedField } from './validated-field'

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
  | ['decisionRules', number, 'margin' | 'threshold']

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
  const generatedId = useId()
  const id = inputProps.id ?? generatedId

  return (
    <FormischField of={form} path={path}>
      {(field) => (
        <ValidatedField field={field} className={className}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>

          <Input
            {...field.props}
            {...inputProps}
            id={id}
            type="number"
            value={field.input ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
          />
        </ValidatedField>
      )}
    </FormischField>
  )
}
