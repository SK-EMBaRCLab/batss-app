import { useField } from '@formisch/react'
import { ChevronDown, Info } from 'lucide-react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
import { Button } from '@/components/ui/button'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { DecisionRuleCard } from './decision-rule-card'

export function DecisionRuleSection({ form }: { form: SimulationFormStore }): ReactElement {
  const rules = useField(form, {
    path: ['decisionRules']
  })

  const addRule = (): void => {
    const current = rules.input ?? []

    rules.onChange([
      ...current,
      {
        type: 'superiority',
        direction: 'greater',
        margin: 1,
        threshold: 0.95
      }
    ])
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between">
        <h3 className="font-semibold">Decision Rules</h3>

        <Button type="button" onClick={addRule} disabled={rules.input.length > 0}>
          Add decision rule
        </Button>
      </div>
      <Collapsible className="shrink-0 rounded-lg border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10">
        <CollapsibleTrigger
          render={
            <Button
              variant="ghost"
              className="group w-full justify-start px-4 py-3 hover:bg-primary/5"
            >
              <Info className="h-4 w-4 text-primary" />

              <span className="font-medium text-primary">About decision rules</span>

              <ChevronDown className="ml-auto text-muted-foreground group-data-panel-open/button:rotate-180" />
            </Button>
          }
        ></CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
            <div className="space-y-5">
              <p className="leading-relaxed">
                Decision rules are predefined conditions that determine whether the trial adapts.
                When a rule is met, a pre-specified action takes place, such as stopping or
                modifying the trial.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Superiority</h4>

                <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                  <li>
                    A superiority rule tests whether one arm appears better than the other (or all
                    others).
                  </li>
                  <li>
                    In this two-arm design, meeting the superiority criterion will stop the trial
                    early and declare the treatment arm superior to the control arm.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">
                  Futility <span className="font-normal">(under development)</span>
                </h4>

                <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                  <li>
                    A futility rule stops a study early if the probability of eventually
                    demonstrating superiority is low.
                  </li>
                  <li>
                    In this two-arm design, meeting the futility rule will stop the trial early,
                    indicating that continuing the trial is unlikely to change the trial conclusion.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {rules.errors?.[0] && <p className="text-sm text-destructive">{rules.errors[0]}</p>}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {(rules.input ?? []).map((_, index) => (
          <DecisionRuleCard
            key={index}
            form={form}
            index={index}
            onRemove={() => {
              const current = rules.input ?? []

              if (current.length === 1) {
                return
              }

              rules.onChange(current.filter((_, i) => i !== index))
            }}
          />
        ))}
      </div>
    </div>
  )
}
