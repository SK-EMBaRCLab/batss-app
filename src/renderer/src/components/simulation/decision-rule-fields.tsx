import { DECISION_RULE_LABELS } from '@shared/design-rules'
import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

/** A rule's margin and cutoff (stored as `threshold`), named for the rule. */
export function DecisionRuleFields({
  form,
  index,
  type
}: {
  form: SimulationFormStore
  index: number
  type: DecisionRule['type']
}): ReactElement {
  const labels = DECISION_RULE_LABELS[type]

  return (
    <div className="@container">
      <div className="grid gap-5 @md:grid-cols-2">
        <NumericField
          form={form}
          path={['decisionRules', index, 'margin']}
          label={labels.margin}
          step="0.01"
        />

        <NumericField
          form={form}
          path={['decisionRules', index, 'threshold']}
          label={labels.threshold}
          step="0.01"
          min="0"
          max="1"
        />
      </div>
    </div>
  )
}
