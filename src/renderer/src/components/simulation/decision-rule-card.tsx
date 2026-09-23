import { useField } from '@formisch/react'
import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import { decisionRuleFormula } from '@/lib/utils'
import type { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleFields } from './decision-rule-fields'
import { DecisionRulePreview } from './decision-rule-preview'

function getDecisionRule(
  type: string | undefined,
  direction: string | undefined,
  margin: string | number | undefined,
  threshold: string | number | undefined
): DecisionRule | null {
  if (type !== 'superiority' && type !== 'futility') {
    return null
  }

  if (direction !== 'greater' && direction !== 'less') {
    return null
  }

  if (margin === '' || threshold === '') {
    return null
  }

  const parsedMargin = Number(margin)
  const parsedThreshold = Number(threshold)

  if (!Number.isFinite(parsedMargin) || !Number.isFinite(parsedThreshold)) {
    return null
  }

  return {
    type,
    direction,
    margin: parsedMargin,
    threshold: parsedThreshold
  }
}

export function DecisionRuleCard({ form }: { form: SimulationFormStore }): ReactElement {
  const typeField = useField(form, { path: ['decisionRules', 0, 'type'] })
  const directionField = useField(form, { path: ['decisionRules', 0, 'direction'] })
  const marginField = useField(form, { path: ['decisionRules', 0, 'margin'] })
  const thresholdField = useField(form, { path: ['decisionRules', 0, 'threshold'] })
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  const outcomeType = useField(form, { path: ['outcomeType'] })
  const treatmentEffect = useField(form, { path: ['treatmentEffect'] })
  const meanDiffInput = useField(form, { path: ['meanDiff'] })

  const rule = getDecisionRule(
    typeField.input,
    directionField.input,
    marginField.input,
    thresholdField.input
  )

  const value =
    outcomeType.input === 'binary' ? Number(treatmentEffect.input) : Number(meanDiffInput.input)

  const formula = rule
    ? decisionRuleFormula({
        ...rule,
        treatmentEffectType:
          outcomeType.input === 'continuous' ? 'meanDifference' : treatmentEffectType.input
      })
    : ''

  const handleTypeChange = (type: 'superiority' | 'futility'): void => {
    typeField.onChange(type)

    if (type === 'superiority') {
      directionField.onChange('greater')
      marginField.onChange(1)
      thresholdField.onChange(0.95)
    }

    if (type === 'futility') {
      directionField.onChange('less')
      marginField.onChange(1)
      thresholdField.onChange(0.05)
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b px-6 py-4">
        <h2 className="text-base font-semibold">Decision Rule</h2>
        <p className="text-sm text-muted-foreground">
          Define the conditions that determine whether the trial adapts
        </p>
      </div>
      <div className="p-6">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {rule && (
            <DecisionRulePreview
              rule={rule}
              value={value}
              formula={formula}
              type={outcomeType.input}
            />
          )}

          <DecisionRuleFields
            type={typeField.input}
            direction={directionField.input}
            margin={marginField.input}
            threshold={thresholdField.input}
            onTypeChange={handleTypeChange}
            onDirectionChange={(direction) => {
              directionField.onChange(direction)
            }}
            onMarginChange={(margin) => {
              marginField.onChange(margin)
            }}
            onThresholdChange={(threshold) => {
              thresholdField.onChange(threshold)
            }}
            marginErrors={marginField.errors ?? undefined}
            thresholdErrors={thresholdField.errors ?? undefined}
          />
        </div>
      </div>
    </div>
  )
}
