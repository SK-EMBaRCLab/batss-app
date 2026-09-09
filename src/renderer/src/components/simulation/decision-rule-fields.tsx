import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type DecisionRuleFieldsProps = {
  type: DecisionRule['type'] | undefined
  direction: DecisionRule['direction'] | undefined
  margin: string | number | undefined
  threshold: string | number | undefined

  onTypeChange: (type: DecisionRule['type']) => void
  onDirectionChange: (direction: DecisionRule['direction']) => void
  onMarginChange: (margin: string) => void
  onThresholdChange: (threshold: string) => void

  marginErrors?: string[]
  thresholdErrors?: string[]
}

export function DecisionRuleFields({
  type,
  direction,
  margin,
  threshold,
  onTypeChange,
  onDirectionChange,
  onMarginChange,
  onThresholdChange,
  marginErrors,
  thresholdErrors
}: DecisionRuleFieldsProps): ReactElement {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field>
        <FieldLabel className="">Decision rule type</FieldLabel>

        <Select
          value={type ?? ''}
          onValueChange={(value) => {
            if (value === 'superiority' || value === 'futility') {
              onTypeChange(value)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select rule type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="superiority">Superiority</SelectItem>
            <SelectItem value="futility" disabled>
              Futility
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel className="">Direction</FieldLabel>

        <Select
          value={direction ?? ''}
          onValueChange={(value) => {
            if (value === 'greater' || value === 'less') {
              onDirectionChange(value)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select direction" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="greater">Greater than</SelectItem>
            <SelectItem value="less">Less than</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel className="">Superiority margin (SM)</FieldLabel>

        <Input
          type="number"
          step="0.01"
          value={margin ?? ''}
          onChange={(event) => onMarginChange(event.target.value)}
        />

        {marginErrors && <FieldError errors={marginErrors.map((message) => ({ message }))} />}
      </Field>

      <Field>
        <FieldLabel className="">Decision threshold (DT)</FieldLabel>

        <Input
          type="number"
          step="0.01"
          value={threshold ?? ''}
          onChange={(event) => onThresholdChange(event.target.value)}
        />

        {thresholdErrors && <FieldError errors={thresholdErrors.map((message) => ({ message }))} />}
      </Field>
    </div>
  )
}
