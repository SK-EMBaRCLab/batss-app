import { insert, remove, useField, useFieldArray } from '@formisch/react'
import type { DecisionRule } from '@shared/simulation-types'
import { Plus } from 'lucide-react'
import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { defaultDecisionRule } from '@/lib/schema'
import type { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleCard } from './decision-rule-card'
import { useFormLocked } from './form-locked'

const RULE_BUTTONS: { type: DecisionRule['type']; label: string }[] = [
  { type: 'superiority', label: 'Add superiority rule' },
  { type: 'futility', label: 'Add futility rule' }
]

// A design has a superiority rule, a futility rule, or one of each. Each
// button adds its rule once; removing the rule's card brings it back.
export function DecisionRuleSection({ form }: { form: SimulationFormStore }): ReactElement {
  const locked = useFormLocked()
  const ruleArray = useFieldArray(form, { path: ['decisionRules'] })
  const rules = useField(form, { path: ['decisionRules'] })
  const outcomeType = useField(form, { path: ['outcomeType'] })

  const types = (rules.input ?? []).map((rule) => rule?.type)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 space-y-1">
        <h3 className="font-semibold">Decision Rules</h3>
        <p className="text-sm text-muted-foreground">
          Add at least one rule. Trials often use both.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {RULE_BUTTONS.map(({ type, label }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            disabled={locked || types.includes(type)}
            onClick={() =>
              insert(form, {
                path: ['decisionRules'],
                initialInput: defaultDecisionRule(type, outcomeType.input)
              })
            }
          >
            <Plus data-icon="inline-start" />
            {label}
          </Button>
        ))}
      </div>

      {ruleArray.errors?.[0] && <p className="text-sm text-destructive">{ruleArray.errors[0]}</p>}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {ruleArray.items.map((id, index) => (
          <DecisionRuleCard
            key={id}
            form={form}
            index={index}
            onRemove={() => remove(form, { path: ['decisionRules'], at: index })}
          />
        ))}
      </div>
    </div>
  )
}
