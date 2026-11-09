import { DECISION_RULE_LABELS } from '@shared/design-rules'
import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement, useId } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type DecisionRuleFieldsProps = {
  type: DecisionRule['type']
  margin: string | number | undefined
  threshold: string | number | undefined

  onMarginChange: (margin: string) => void
  onThresholdChange: (threshold: string) => void

  marginErrors?: string[]
  thresholdErrors?: string[]
}

export function DecisionRuleFields({
  type,
  margin,
  threshold,
  onMarginChange,
  onThresholdChange,
  marginErrors,
  thresholdErrors
}: DecisionRuleFieldsProps): ReactElement {
  const id = useId()
  const labels = DECISION_RULE_LABELS[type]

  return (
    <div className="@container">
      <div className="grid gap-5 @md:grid-cols-2">
        <Field data-invalid={marginErrors !== undefined}>
          <FieldLabel htmlFor={`${id}-margin`}>{labels.margin}</FieldLabel>

          <Input
            id={`${id}-margin`}
            type="number"
            step="0.01"
            value={margin ?? ''}
            onChange={(event) => onMarginChange(event.target.value)}
          />

          {marginErrors && <FieldError errors={marginErrors.map((message) => ({ message }))} />}
        </Field>

        <Field data-invalid={thresholdErrors !== undefined}>
          <FieldLabel htmlFor={`${id}-threshold`}>{labels.threshold}</FieldLabel>

          <Input
            id={`${id}-threshold`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={threshold ?? ''}
            onChange={(event) => onThresholdChange(event.target.value)}
          />

          {thresholdErrors && (
            <FieldError errors={thresholdErrors.map((message) => ({ message }))} />
          )}
        </Field>
      </div>
    </div>
  )
}
