import { Field as FormischField } from '@formisch/react'
import { Fragment, type ReactElement } from 'react'

import { CollapsibleInfoPanel } from '@/components/common/collapsible-info-panel'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'
import { treatmentEffects } from './utils'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Binary Outcome Parameters</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <NumericField
            form={form}
            path={['probability']}
            label="Control arm event probability"
            min={0}
            max={1}
            step="0.01"
            className="max-w-lg"
          />

          <FormischField of={form} path={['treatmentEffectType']}>
            {(field) => {
              const selectedTreatmentEffect = treatmentEffects.find(
                (effect) => effect.value === field.input
              )

              return (
                <Field data-invalid={field.errors !== null} className="max-w-lg">
                  <FieldLabel>Treatment effect</FieldLabel>
                  <FieldDescription>
                    Difference betweeen treatment arm and control arm
                  </FieldDescription>

                  <Select
                    value={field.input ?? ''}
                    onValueChange={(value) => {
                      if (
                        value === 'oddsRatio' ||
                        value === 'riskDifference' ||
                        value === 'riskRatio'
                      ) {
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select effect type">
                        {selectedTreatmentEffect?.label}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {treatmentEffects.map((effect) => (
                        <SelectItem
                          key={effect.value}
                          value={effect.value}
                          disabled={effect.value !== 'oddsRatio'}
                        >
                          {effect.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.errors && (
                    <FieldError
                      errors={field.errors.map((message) => ({
                        message
                      }))}
                    />
                  )}
                </Field>
              )
            }}
          </FormischField>
          <NumericField
            form={form}
            path={['treatmentEffect']}
            label="Treatment effect value"
            className="max-w-lg"
          />
        </div>
        <CollapsibleInfoPanel title="About Outcome Parameters">
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Control arm event probability</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The probability that patient in the control group experiences the outcome of
                  interest. If the control arm event probabilty is 0.4, then about 40% of patients
                  in the control group experiences the event of interest
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Treatment effect</h4>

                <dl className="space-y-2">
                  {treatmentEffects.map((effect) => (
                    <Fragment key={effect.value}>
                      <dt className="font-medium text-muted-foreground">{effect.label}</dt>
                      <dd className="space-y-2 pl-5 leading-relaxed">{effect.description}</dd>
                    </Fragment>
                  ))}
                </dl>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Treatment effect value</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The assumed size of the treatment effect used in the simulation. This value is
                  often based on previous research, clinical expertise, or the minimum improvement
                  that would justify adopting the treatment in practice
                </p>
              </div>
            </div>
          </div>
        </CollapsibleInfoPanel>
      </div>
    </div>
  )
}
