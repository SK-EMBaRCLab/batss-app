import { type ReactElement } from 'react'
import { Field as FormischField } from '@formisch/react'

import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'

import { Input } from '@/components/ui/input'

import type { SimulationFormStore } from '@/components/types'

export function SampleSizeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="font-semibold">Sample Size Parameters</h3>

        <FormischField of={form} path={['m0']}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel>Burn-in (m0)</FieldLabel>
              <FieldDescription>
                The number of patients need to have recruited before analyzing data. The larger the
                sample size the more accurate
              </FieldDescription>
              <Input
                {...field.props}
                type="number"
                min={1}
                step={1}
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

        <FormischField of={form} path={['m']}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel>Patients between interim analyses (m)</FieldLabel>
              <FieldDescription>
                Number of extra patients to recruite between analyses. Add validation M less than N
                - M0
              </FieldDescription>
              <Input
                {...field.props}
                type="number"
                min={1}
                step={1}
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

        <FormischField of={form} path={['N']}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel>Maximum sample size (N)</FieldLabel>
              <FieldDescription>MAx number of patients recruited</FieldDescription>
              <Input
                {...field.props}
                type="number"
                min={1}
                step={1}
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
      <div className="space-y-6 border-t pt-6">
        <h3 className="font-semibold">Simulation</h3>

        <FormischField of={form} path={['R']}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel>Number of simulated trials (R)</FieldLabel>
              <FieldDescription>Describe this</FieldDescription>
              <Input
                {...field.props}
                type="number"
                min={1}
                step={1}
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
    </div>
  )
}
