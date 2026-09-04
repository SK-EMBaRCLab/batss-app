import type { DecisionRule } from '@shared/simulation-types'
import { CircleQuestionMark } from 'lucide-react'
import { ReactElement } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

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

type FieldLabelWithTooltipProps = {
  children: React.ReactNode
  tooltip: React.ReactNode
}

function FieldLabelWithTooltip({ children, tooltip }: FieldLabelWithTooltipProps): ReactElement {
  return (
    <FieldLabel className="flex min-h-8 items-center">
      {children}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" className="ml-1">
              <CircleQuestionMark />
            </Button>
          }
        />
        <TooltipContent side="top" className="max-w-sm text-left">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </FieldLabel>
  )
}

const tooltips = {
  direction: (
    <>
      Indicates whether a larger or smaller treatment effect is considered beneficial. Use{' '}
      <strong>Greater than (&gt;)</strong> when higher values are better and{' '}
      <strong>Less than (&lt;)</strong> when lower values are better.
    </>
  ),

  margin: (
    <>
      The minimum treatment difference that is clinically meaningful (i.e., 0 or the minimal
      clinically important difference).
    </>
  ),

  threshold: (
    <>
      The probability required for a rule to be triggered. Common values include 0.90, 0.95, 0.975,
      and 0.99.
    </>
  )
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
        <FieldLabel className="min-h-8 flex items-center">Decision rule type</FieldLabel>

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
            <SelectItem value="futility">Futility</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabelWithTooltip tooltip={tooltips.direction}>Direction</FieldLabelWithTooltip>

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
        <FieldLabelWithTooltip tooltip={tooltips.margin}>
          Superiority margin (SM)
        </FieldLabelWithTooltip>

        <Input
          type="number"
          step="0.01"
          value={margin ?? ''}
          onChange={(event) => onMarginChange(event.target.value)}
        />

        {marginErrors && <FieldError errors={marginErrors.map((message) => ({ message }))} />}
      </Field>

      <Field>
        <FieldLabelWithTooltip tooltip={tooltips.threshold}>
          Decision threshold (DT)
        </FieldLabelWithTooltip>

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
