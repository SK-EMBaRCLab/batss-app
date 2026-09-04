import { Field as FormischField } from '@formisch/react'
import { CircleQuestionMark } from 'lucide-react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
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
import { treatmentEffects } from './utils'

export function BinaryOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Binary Outcome Parameters</h3>

      <FormischField of={form} path={['probability']}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel>
              Control arm event probability
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm">
                      <CircleQuestionMark />
                    </Button>
                  }
                />
                <TooltipContent side="right">
                  <p>
                    The probability that patient in the control group experiences the outcome of
                    interest. If the control arm event probabilty is 0.4, then about 40% of patients
                    in the control group experiences the event of interest
                  </p>
                </TooltipContent>
              </Tooltip>
            </FieldLabel>
            <FieldDescription>
              The probability that patient in the control group experiences the outcome of interest.
              If the control arm event probabilty is 0.4, then about 40% of patients in the control
              group experiences the event of interest
            </FieldDescription>
            <Input
              {...field.props}
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={field.input ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />

            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </Field>
        )}
      </FormischField>

      <FormischField of={form} path={['treatmentEffectType']}>
        {(field) => (
          <Field>
            <FieldLabel>Treatment effect</FieldLabel>
            <FieldDescription>Difference betweeen treatment arm and control arm</FieldDescription>
            <small>
              {treatmentEffects.find((effect) => effect.value === field.input)?.description}
            </small>

            <Select
              value={field.input ?? ''}
              onValueChange={(value) => {
                if (value === 'oddsRatio' || value === 'riskDifference' || value === 'riskRatio') {
                  field.onChange(value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select effect type" />
              </SelectTrigger>

              <SelectContent>
                {treatmentEffects.map((effect) => (
                  <SelectItem key={effect.value} value={effect.value}>
                    {effect.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </Field>
        )}
      </FormischField>

      <FormischField of={form} path={['treatmentEffect']}>
        {(field) => (
          <Field>
            <FieldLabel>Treatment effect value</FieldLabel>
            <FieldDescription>
              The assumed size of the treatment effect used in the simulation. This value is often
              based on previous research, clinical expertise, or the minimum improvement that would
              justify adopting the treatment in practice
            </FieldDescription>
            <Input
              {...field.props}
              type="number"
              value={field.input ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
            {field.errors && (
              <FieldError
                errors={field.errors.map((message) => ({
                  message
                }))}
              />
            )}
          </Field>
        )}
      </FormischField>
    </div>
  )
}
