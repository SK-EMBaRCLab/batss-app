import { useField } from '@formisch/react'
import { type Direction, effectDirection } from '@shared/effect-direction'
import type { DecisionRule, OutcomeType } from '@shared/simulation-types'
import { X } from 'lucide-react'
import { type ReactElement, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { decisionRuleFormula } from '@/lib/utils'
import type { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleFields } from './decision-rule-fields'
import { DecisionRulePreview } from './decision-rule-preview'
import { useFormLocked } from './form-locked'
import { shownErrors, useStepAttempted } from './step-errors'

const RULE_TEXT = {
  superiority: {
    title: 'Superiority rule',
    description: 'Stops the trial early and declares the treatment arm superior'
  },
  futility: {
    title: 'Futility rule',
    description: 'Stops the trial early when the treatment is unlikely to show a benefit'
  }
} as const satisfies Record<DecisionRule['type'], { title: string; description: string }>

function getDecisionRule(
  type: DecisionRule['type'],
  margin: string | number | undefined,
  threshold: string | number | undefined
): DecisionRule | null {
  if (margin === '' || threshold === '') {
    return null
  }

  const parsedMargin = Number(margin)
  const parsedThreshold = Number(threshold)

  if (!Number.isFinite(parsedMargin) || !Number.isFinite(parsedThreshold)) {
    return null
  }

  return { type, margin: parsedMargin, threshold: parsedThreshold }
}

type PreviewSnapshot = {
  rule: DecisionRule
  direction: Direction
  value: number
  formula: string
  type: OutcomeType | undefined
}

type DecisionRuleCardProps = {
  form: SimulationFormStore
  index: number
  onRemove: () => void
}

export function DecisionRuleCard({ form, index, onRemove }: DecisionRuleCardProps): ReactElement {
  const locked = useFormLocked()
  const attempted = useStepAttempted()
  const typeField = useField(form, { path: ['decisionRules', index, 'type'] })
  const marginField = useField(form, { path: ['decisionRules', index, 'margin'] })
  const thresholdField = useField(form, { path: ['decisionRules', index, 'threshold'] })
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  const outcomeType = useField(form, { path: ['outcomeType'] })
  const treatmentEffect = useField(form, { path: ['treatmentEffect'] })
  const meanDiffInput = useField(form, { path: ['meanDiff'] })

  // Set when the rule is added and never changed
  const ruleType: DecisionRule['type'] = typeField.input === 'futility' ? 'futility' : 'superiority'
  const text = RULE_TEXT[ruleType]

  const rule = useMemo(
    () => getDecisionRule(ruleType, marginField.input, thresholdField.input),
    [ruleType, marginField.input, thresholdField.input]
  )

  // Follows the sign of the treatment effect, as BATSS's `alternative` does
  const direction = effectDirection({
    outcomeType: outcomeType.input,
    treatmentEffect: treatmentEffect.input,
    meanDiff: meanDiffInput.input
  })

  const value =
    outcomeType.input === 'binary' ? Number(treatmentEffect.input) : Number(meanDiffInput.input)

  const formula = rule
    ? decisionRuleFormula({
        ...rule,
        direction,
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
      setLastValidPreview({ rule, direction, value, formula, type: outcomeType.input })
    }
  }, [rule, direction, value, formula, outcomeType.input])

  const preview = rule
    ? { rule, direction, value, formula, type: outcomeType.input }
    : lastValidPreview
  const isStale = !rule && !!preview

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h4 className="text-base font-semibold">{text.title}</h4>
          <p className="text-sm text-muted-foreground">{text.description}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={locked}
          aria-label={`Remove ${text.title.toLowerCase()}`}
          onClick={onRemove}
        >
          <X />
        </Button>
      </div>
      {/* Sized by the card's own width (container queries), not the window's:
          the help panel and padding leave it much narrower than the screen */}
      <div className="@container p-6">
        <div className="grid gap-8 @3xl:grid-cols-[1.4fr_1fr]">
          {preview && (
            <DecisionRulePreview
              rule={preview.rule}
              direction={preview.direction}
              value={preview.value}
              formula={preview.formula}
              type={preview.type}
              stale={isStale}
              onMarginChange={(margin) => marginField.onChange(String(margin))}
            />
          )}

          <DecisionRuleFields
            type={ruleType}
            margin={marginField.input}
            threshold={thresholdField.input}
            onMarginChange={(margin) => {
              marginField.onChange(margin)
            }}
            onThresholdChange={(threshold) => {
              thresholdField.onChange(threshold)
            }}
            marginErrors={
              shownErrors(marginField.errors, marginField.isTouched, attempted) ?? undefined
            }
            thresholdErrors={
              shownErrors(thresholdField.errors, thresholdField.isTouched, attempted) ?? undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
