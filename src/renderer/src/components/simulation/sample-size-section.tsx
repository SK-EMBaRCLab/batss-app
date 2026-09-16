import { Field as FormischField } from '@formisch/react'
import { type ReactElement } from 'react'

import { CollapsibleInfoPanel } from '@/components/common/collapsible-info-panel'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SimulationFormStore } from '@/types/form-types'

export function SampleSizeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Sample Size Parameters</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <FormischField of={form} path={['m0']}>
            {(field) => (
              <Field data-invalid={field.errors !== null}>
                <FieldLabel>Burn-in</FieldLabel>
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
                <FieldLabel>Patients between interim analyses</FieldLabel>
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
                <FieldLabel>Maximum sample size</FieldLabel>
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
          <div className="space-y-6 border-t pt-6">
            <h3 className="font-semibold">Simulation Parameter</h3>

            <FormischField of={form} path={['R']}>
              {(field) => (
                <Field data-invalid={field.errors !== null} className="max-w-lg">
                  <FieldLabel>Number of simulated trials</FieldLabel>
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
        <CollapsibleInfoPanel title="About Sample Size Parameters">
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Burn-in</h4>

                <p className="list-disc space-y-2 pl-5 leading-relaxed">
                  The number of patients that must be enrolled before the trial may adapt based on
                  accumulating data. Larger burn-in periods provide more initial data to inform
                  adaptive decisions but delay adaptation.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Patients between interim analyses</h4>

                <p className="list-disc space-y-2 pl-5 leading-relaxed">
                  The number of patients enrolled analyses of the accumulating trial data. Smaller
                  values allow the trial to response more quickly to new evidence but require more
                  frequent analyses.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Maximum sample size</h4>

                <p className="list-disc space-y-2 pl-5 leading-relaxed">
                  The maximum number of participants that the trial can enroll. This may be
                  determined based on funding constraints.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Number of simulated trials</h4>

                <p className="list-disc space-y-2 pl-5 leading-relaxed">
                  The number of trial simulations used to evaluate the operating characteristics of
                  the design, At least 1,000 simulations are recommended for reliable estimates, but
                  smaller values may be useful during model development or tuning to reduce
                  computation time.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleInfoPanel>
      </div>
    </div>
  )
}
