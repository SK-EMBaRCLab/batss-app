import { useField } from '@formisch/react'
import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement, useEffect, useMemo, useState } from 'react'

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

type PreviewSnapshot = {
  rule: DecisionRule
  value: number
  formula: string
  type: 'binary' | 'continuous' | 'ordinal' | undefined
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

  const rule = useMemo(
    () =>
      getDecisionRule(
        typeField.input,
        directionField.input,
        marginField.input,
        thresholdField.input
      ),
    [typeField.input, directionField.input, marginField.input, thresholdField.input]
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

  // Keep showing the last valid preview while margin/threshold are
  // momentarily empty (e.g. the user selected-all and is retyping a
  // number) instead of unmounting the whole chart + formula box, which
  // reads as "did I break something?" rather than "I'm mid-edit."
  // Only ever read when `rule` is currently null, so the one-render
  // lag from committing this in an effect (rather than during render)
  // is never visible — the snapshot was already captured on the prior
  // render, back when the fields were last valid.
  const [lastValidPreview, setLastValidPreview] = useState<PreviewSnapshot | null>(null)

  useEffect(() => {
    if (rule) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastValidPreview({ rule, value, formula, type: outcomeType.input })
    }
  }, [rule, value, formula, outcomeType.input])

  const preview = rule ? { rule, value, formula, type: outcomeType.input } : lastValidPreview
  const isStale = !rule && !!preview

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
          {preview && (
            <DecisionRulePreview
              rule={preview.rule}
              value={preview.value}
              formula={preview.formula}
              type={preview.type}
              stale={isStale}
              onMarginChange={(margin) => marginField.onChange(String(margin))}
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
