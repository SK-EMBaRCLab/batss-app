import { Field as FormischField } from '@formisch/react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
                The number of patients that must be enrolled before the trial may adapt based on
                accumulating data. Larger burn-in periods provide more initial data to inform
                adaptive decisions but delay adaptation.
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
                The number of patients enrolled analyses of the accumulating trial data. Smaller
                values allow the trial to response more quickly to new evidence but require more
                frequent analyses.
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
              <FieldDescription>
                The maximum number of participants that the trial can enroll. This may be determined
                based on funding constraints.
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
      </div>
      <div className="space-y-6 border-t pt-6">
        <h3 className="font-semibold">Simulation Parameter</h3>

        <FormischField of={form} path={['R']}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel>Number of simulated trials (R)</FieldLabel>
              <FieldDescription>
                The number of trial simulations used to evaluate the operating characteristics of
                the design, At least 1,000 simulations are recommended for reliable estimates, but
                smaller values may be useful during model development or tuning to reduce
                computation time.
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
      </div>
    </div>
  )
}
