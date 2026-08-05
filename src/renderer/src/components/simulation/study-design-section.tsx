import { JSX } from 'react'
import { Field as FormischField, useField } from '@formisch/react'
import {
  Field as ShadcnField,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldTitle,
  FieldContent
} from '@/components/ui/field'

import { FormSection } from '../form-section'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Input } from '../ui/input'
import { SimulationFormStore } from '../types'

const primaryOutcomes = [
  {
    id: 'A',
    title: 'Positive',
    description: 'Is your primary outcome a positive (A) event'
  },
  {
    id: 'B',
    title: 'Negative',
    description: 'Is your primary outcome a negative (B) event'
  }
]

export function StudyDesignSection({ form }: { form: SimulationFormStore }): JSX.Element {
  const outcome = useField(form, { path: ['primaryOutcome'] })
  const probability = useField(form, { path: ['probability'] })
  const logOdds = useField(form, { path: ['logOdds'] })

  const selectedOutcome = primaryOutcomes.find((out) => out.id === outcome.input)
  return (
    <FormSection
      title="Study Design"
      description="Define the primary outcome and treatment assumptions."
      summary={`${selectedOutcome?.title ?? '—'} · probability ${probability.input ?? '—'} · logOdds ${logOdds.input ?? '—'}`}
    >
      <FormischField of={form} path={['primaryOutcome']}>
        {(field) => (
          <FieldSet>
            <FieldLegend>Primary Outcome</FieldLegend>
            <RadioGroup value={field.input} onValueChange={field.onChange}>
              {primaryOutcomes.map((outcome) => (
                <FieldLabel key={outcome.id} htmlFor={`form-radiogroup-${outcome.id}`}>
                  <ShadcnField orientation="horizontal" data-invalid={field.errors !== null}>
                    <FieldContent>
                      <FieldTitle>{outcome.title}</FieldTitle>
                      <FieldDescription>{outcome.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value={outcome.id}
                      id={`form-radiogroup-${outcome.id}`}
                      aria-invalid={field.errors !== null}
                    />
                  </ShadcnField>
                </FieldLabel>
              ))}
            </RadioGroup>
            {field.errors && <FieldError errors={field.errors.map((message) => ({ message }))} />}
          </FieldSet>
        )}
      </FormischField>
      <FormischField of={form} path={['probability']}>
        {(field) => (
          <ShadcnField data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="form-probabilityOutcome">
              Probability of primary outcome
            </FieldLabel>

            <Input
              {...field.props}
              type="number"
              id="form-probabilityOutcome"
              step="0.01"
              value={field.input ?? ''}
              aria-invalid={field.errors !== null}
              autoComplete="off"
            />

            {field.errors && <FieldError errors={field.errors.map((message) => ({ message }))} />}
          </ShadcnField>
        )}
      </FormischField>
      <FormischField of={form} path={['logOdds']}>
        {(field) => (
          <ShadcnField data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="form-logOdds">log-odds ratio of the treatment effect</FieldLabel>

            <Input
              {...field.props}
              type="number"
              id="form-logOdds"
              step="0.01"
              value={field.input ?? ''}
              aria-invalid={field.errors !== null}
              autoComplete="off"
            />

            {field.errors && <FieldError errors={field.errors.map((message) => ({ message }))} />}
          </ShadcnField>
        )}
      </FormischField>
    </FormSection>
  )
}
