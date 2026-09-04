import { Field as FormischField } from '@formisch/react'
import { ChevronDown, Info } from 'lucide-react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
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

import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

const outcomeTypes = ['binary', 'continuous', 'ordinal'] as const

type OutcomeType = (typeof outcomeTypes)[number]

export function OutcomeTypeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <FormischField of={form} path={['outcomeType']}>
      {(field) => {
        return (
          <ShadcnField data-invalid={field.errors !== null}>
            <FieldLabel>Outcome Type</FieldLabel>
            <FieldDescription>
              Select the outcome type that matches your primary study endpoint
            </FieldDescription>
            <Collapsible className="shrink-0 rounded-lg border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10">
              <CollapsibleTrigger
                render={
                  <Button
                    variant="ghost"
                    className="group w-full justify-start px-4 py-3 hover:bg-primary/5"
                  >
                    <Info className="h-4 w-4 text-primary" />

                    <span className="font-medium text-primary">About outcome types</span>

                    <ChevronDown className="ml-auto text-muted-foreground group-data-panel-open/button:rotate-180" />
                  </Button>
                }
              />

              <CollapsibleContent>
                <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
                  <div className="space-y-5">
                    <p className="leading-relaxed">
                      Decision rules are predefined conditions that determine whether the trial
                      adapts. When a rule is met, a pre-specified action takes place, such as
                      stopping or modifying the trial.
                    </p>

                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">Binary</h4>

                      <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                        <li>Each participant either experiences the event or does not</li>
                        <li>Examples: treatment response, disease remission</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">Continuous</h4>

                      <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                        <li>Each participant has a numerical measurement</li>
                        <li> Examples: blood pressure, cholesterol level</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">
                        Ordinal <span className="font-normal">(under development)</span>
                      </h4>

                      <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                        <li>Each participant is scored with an ordered category</li>
                        <li>Examples: WHO clinical progression scale, modified Rankin scale</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">
                        Count <span className="font-normal">(under development)</span>
                      </h4>

                      <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                        <li>Each participant contributes a non-negative event count</li>
                        <li>Examples: number of seizures or hospital visits</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Select
              value={field.input ?? ''}
              onValueChange={(value) => {
                if (outcomeTypes.includes(value as OutcomeType)) {
                  field.onChange(value as OutcomeType)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome type" className="capitalize" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="binary">Binary</SelectItem>

                <SelectItem value="continuous">Continuous</SelectItem>

                <SelectItem value="ordinal" disabled>
                  Ordinal (under development)
                </SelectItem>

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
        )
      }}
    </FormischField>
  )
}
