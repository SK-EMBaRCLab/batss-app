import { useField } from '@formisch/react'
import type { DecisionRule } from '@shared/simulation-types'
import { Trash2 } from 'lucide-react'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/components/types'
import { Button } from '@/components/ui/button'
import { decisionRuleFormula } from '@/lib/utils'

import { DecisionRuleFields } from './decision-rule-fields'
import { DecisionRulePreview } from './decision-rule-preview'

type DecisionRuleCardProps = {
  form: SimulationFormStore
  index: number
  onRemove: () => void
}

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

  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  const treatmentEffect = useField(form, {
    path: ['treatmentEffect']
  })

  const rule = getDecisionRule(
    typeField.input,
    directionField.input,
    marginField.input,
    thresholdField.input
  )

  const oddsRatio = Number(treatmentEffect.input)

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
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-base font-semibold">Decision Rule {index + 1}</h2>
          <p className="text-sm text-muted-foreground">
            Define when the treatment is considered superior or futile.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove decision rule ${index + 1}`}
          disabled={index === 0}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="p-6">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {outcomeType.input === 'binary' && rule && (
            <DecisionRulePreview rule={rule} oddsRatio={oddsRatio} formula={formula} />
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
