import { type ReactElement } from 'react'
import { useField } from '@formisch/react'

import type { SimulationFormStore } from '@/components/types'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '../ui/button'
import { Trash2 } from 'lucide-react'
import { Input } from '../ui/input'
import { decisionRuleFormula } from '@/lib/utils'

type DecisionRuleCardProps = {
  form: SimulationFormStore
  index: number
  onRemove: () => void
}

export function DecisionRuleCard({ form, index, onRemove }: DecisionRuleCardProps): ReactElement {
  const typeField = useField(form, {
    path: ['decisionRules', index, 'type']
  })

  const directionField = useField(form, {
    path: ['decisionRules', index, 'direction']
  })

  const marginField = useField(form, {
    path: ['decisionRules', index, 'margin']
  })

  const thresholdField = useField(form, {
    path: ['decisionRules', index, 'threshold']
  })

  const treatmentEffectType = useField(form, {
    path: ['treatmentEffectType']
  })

  const formula = decisionRuleFormula({
    type: typeField.input,
    direction: directionField.input,
    margin: marginField.input,
    threshold: thresholdField.input,
    treatmentEffectType: treatmentEffectType.input
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decision Rule {index + 1}</CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove decision rule ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-3 text-sm">
          <div className="capitalize">
            Treatment will stop for {typeField.input ?? 'decision'} if:
          </div>

          <div className="mt-2 font-mono font-semibold">{formula}</div>
        </div>
        <Field>
          <FieldLabel>Decision rule type</FieldLabel>
          <FieldDescription>Is treatment superior to control</FieldDescription>
          <Select
            value={typeField.input ?? ''}
            onValueChange={(value) => {
              if (value !== 'superiority' && value !== 'futility') {
                return
              }

              typeField.onChange(value)

              if (value === 'superiority') {
                directionField.onChange('greater')
                marginField.onChange(1)
                thresholdField.onChange(0.95)
              }

              if (value === 'futility') {
                directionField.onChange('less')
                marginField.onChange(1)
                thresholdField.onChange(0.05)
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
          <FieldLabel>Direction</FieldLabel>

          <Select
            value={directionField.input ?? ''}
            onValueChange={(value) => {
              if (value === 'greater' || value === 'less') {
                directionField.onChange(value)
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
          <FieldLabel>Superiority margin (SM)</FieldLabel>
          <FieldDescription>Denotes what meets a clinicly meaningful margin </FieldDescription>

          <Input
            type="number"
            step="0.01"
            value={marginField.input ?? ''}
            onChange={(e) => marginField.onChange(e.target.value)}
          />

          {marginField.errors && (
            <FieldError
              errors={marginField.errors.map((message) => ({
                message
              }))}
            />
          )}
        </Field>
        <Field>
          <FieldLabel>Decision threshold (DT)</FieldLabel>

          <Input
            type="number"
            step="0.01"
            value={thresholdField.input ?? ''}
            onChange={(e) => thresholdField.onChange(e.target.value)}
          />

          {thresholdField.errors && (
            <FieldError
              errors={thresholdField.errors.map((message) => ({
                message
              }))}
            />
          )}
        </Field>
      </CardContent>
    </Card>
  )
}
