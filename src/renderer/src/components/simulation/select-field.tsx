import type { FieldElementProps } from '@formisch/react'
import { type ReactElement, useId } from 'react'

import { FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { useFormLocked } from './form-locked'
import { ValidatedField } from './validated-field'

export type SelectOption<T extends string> = { value: T; label: string; enabled: boolean }

// The parts of a formisch field this uses, so any field holding one of
// the options' values fits
type SelectFieldState<T extends string> = {
  input: T | undefined
  onChange: (value: T) => void
  props: Pick<FieldElementProps, 'onFocus' | 'onBlur'>
  errors: [string, ...string[]] | null
  isTouched: boolean
}

const optionLabel = ({ label, enabled }: { label: string; enabled: boolean }): string =>
  enabled ? label : `${label} (under development)`

/**
 * A dropdown for a choice from a fixed list. Only an enabled option's
 * value is ever set, and the selected option shows by its label.
 */
export function SelectField<T extends string>({
  field,
  label,
  description,
  placeholder,
  options,
  upcoming = [],
  className
}: {
  field: SelectFieldState<T>
  label: string
  description?: string
  placeholder: string
  options: readonly SelectOption<T>[]
  // Listed, but not a value the field can hold yet (shown disabled)
  upcoming?: readonly string[]
  className?: string
}): ReactElement {
  const locked = useFormLocked()
  const labelId = useId()
  const selected = options.find((option) => option.value === field.input)

  return (
    <ValidatedField field={field} className={className}>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}

      <Select
        disabled={locked}
        value={field.input ?? ''}
        onValueChange={(value) => {
          const option = options.find((candidate) => candidate.enabled && candidate.value === value)
          if (option) field.onChange(option.value)
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          // formisch's focus and blur: mark the choice touched, so its
          // error shows once used (see step-errors.ts)
          onFocus={field.props.onFocus}
          onBlur={field.props.onBlur}
        >
          <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={!option.enabled}>
              {optionLabel(option)}
            </SelectItem>
          ))}

          {upcoming.map((name) => (
            <SelectItem key={name} value={`upcoming:${name}`} disabled>
              {optionLabel({ label: name, enabled: false })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ValidatedField>
  )
}
