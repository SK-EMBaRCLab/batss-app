import { type ReactElement } from 'react'
import { useField } from '@formisch/react'

import type { SimulationFormStore } from '@/components/types'
import { Button } from '@/components/ui/button'
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
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex shrink-0 items-center justify-between">
        <h3 className="font-semibold">Decision Rules</h3>

        <Button type="button" onClick={addRule}>
          Add decision rule
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
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
