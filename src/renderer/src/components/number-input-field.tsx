import type { ReactElement } from 'react'

import { Field as ShadcnField, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function NumberInputField({
  id,
  label,
  field
}: {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any
}): ReactElement {
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
