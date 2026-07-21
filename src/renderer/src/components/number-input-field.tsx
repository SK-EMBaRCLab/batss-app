import type { JSX } from 'react'
import { Field as ShadcnField, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'

export function NumberInputField({
  id,
  label,
  field
}: {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any
}): JSX.Element {
  return (
    <ShadcnField data-invalid={field.errors !== null}>
      <FieldLabel>{label}</FieldLabel>

      <Input
        {...field.props}
        id={id}
        type="number"
        value={field.input ?? ''}
        aria-invalid={field.errors !== null}
      />

      {field.errors && <FieldError errors={field.errors.map((message) => ({ message }))} />}
    </ShadcnField>
  )
}
