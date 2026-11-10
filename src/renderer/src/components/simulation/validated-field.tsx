import { type ReactElement, type ReactNode } from 'react'

import { Field, FieldError } from '@/components/ui/field'

import { shownErrors, useStepAttempted } from './step-errors'

type FieldState = { errors: [string, ...string[]] | null; isTouched: boolean }

/**
 * A form field with its errors, shown once the field is touched or Next
 * has been tried on its step (see step-errors.ts). A component, so it can
 * read the step from context even inside formisch's render props.
 */
export function ValidatedField({
  field,
  className,
  children
}: {
  field: FieldState
  className?: string
  children: ReactNode
}): ReactElement {
  const errors = shownErrors(field.errors, field.isTouched, useStepAttempted())

  return (
    <Field data-invalid={errors !== null} className={className}>
      {children}
      {errors && <FieldError errors={errors.map((message) => ({ message }))} />}
    </Field>
  )
}
