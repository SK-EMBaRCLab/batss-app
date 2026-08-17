import { type ReactElement } from 'react'
import { Field as FormischField } from '@formisch/react'

import {
  Field as ShadcnField,
  FieldLabel,
  FieldError,
  FieldDescription
} from '@/components/ui/field'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import type { SimulationFormStore } from '@/components/types'

const outcomeTypes = ['binary', 'continuous', 'ordinal'] as const

type OutcomeType = (typeof outcomeTypes)[number]

export function OutcomeTypeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <FormischField of={form} path={['outcomeType']}>
      {(field) => {
        return (
          <ShadcnField data-invalid={field.errors !== null}>
            <FieldLabel>Primary outcome type</FieldLabel>
            <FieldDescription>Describes different types of data</FieldDescription>
            <Select
              value={field.input ?? ''}
              onValueChange={(value) => {
                if (outcomeTypes.includes(value as OutcomeType)) {
                  field.onChange(value as OutcomeType)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="binary">Binary</SelectItem>

                <SelectItem value="continuous">Continuous</SelectItem>

                <SelectItem value="ordinal">Ordinal</SelectItem>
              </SelectContent>
            </Select>

            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </ShadcnField>
        )
      }}
    </FormischField>
  )
}
