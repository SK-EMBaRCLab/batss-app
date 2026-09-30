import { Field as FormischField } from '@formisch/react'
import { type ReactElement } from 'react'

import {
  Field as ShadcnField,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { outcomeTypes } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

type OutcomeType = (typeof outcomeTypes)[number]['value']

export function OutcomeTypeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <FormischField of={form} path={['outcomeType']}>
      {(field) => {
        return (
          <>
            <ShadcnField data-invalid={field.errors !== null} className="max-w-lg">
              <FieldLabel>Outcome Type</FieldLabel>
              <FieldDescription>
                Select the outcome type that matches your primary study endpoint
              </FieldDescription>

              <Select
                value={field.input ?? ''}
                onValueChange={(value) => {
                  if (outcomeTypes.some((type) => type.value === value)) {
                    field.onChange(value as OutcomeType)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome type" className="capitalize" />
                </SelectTrigger>

                <SelectContent>
                  {outcomeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} disabled={!type.enabled}>
                      {type.label}
                      {!type.enabled && ' (under development)'}
                    </SelectItem>
                  ))}

                  <SelectItem value="count" disabled>
                    Count (under development)
                  </SelectItem>
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
          </>
        )
      }}
    </FormischField>
  )
}
