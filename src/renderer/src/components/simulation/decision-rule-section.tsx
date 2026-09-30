import { useField } from '@formisch/react'
import { type ReactElement, useEffect } from 'react'

import { defaultDecisionRule } from '@/lib/schema'
import type { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleCard } from './decision-rule-card'

export function DecisionRuleSection({ form }: { form: SimulationFormStore }): ReactElement {
  const rules = useField(form, {
    path: ['decisionRules']
  })
  const ruleCount = rules.input?.length ?? 0

  // Only one decision rule is supported today — BATSS's futility arm
  // isn't wired up yet (see batss-simulation.R: fut.arm is hard-coded
  // NULL and only decisionRules[[1]] is ever read). The array shape is
  // kept in the schema/file format for forward compatibility; the form
  // only ever edits index 0. This guards against a design saved before
  // this default existed, or before the wizard's first save, loading
  // with zero rules.
  useEffect(() => {
    if (ruleCount === 0) {
      rules.onChange([defaultDecisionRule])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleCount])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h3 className="shrink-0 font-semibold">Decision Rules</h3>

      {rules.errors?.[0] && <p className="text-sm text-destructive">{rules.errors[0]}</p>}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {ruleCount > 0 && <DecisionRuleCard form={form} />}
      </div>
    </div>
  )
}
