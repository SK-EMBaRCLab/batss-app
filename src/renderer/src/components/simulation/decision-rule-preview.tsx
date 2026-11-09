import type { Direction } from '@shared/effect-direction'
import type { DecisionRule, OutcomeType } from '@shared/simulation-types'
import { MoveHorizontal } from 'lucide-react'
import { type ReactElement } from 'react'

import { cn } from '@/lib/utils'

import { DecisionChart } from './decision-rule-chart'

type DecisionRulePreviewProps = {
  rule: DecisionRule
  direction: Direction
  value: number
  formula: string
  type: OutcomeType | undefined
  onMarginChange?: (margin: number) => void
  stale?: boolean
}

export function DecisionRulePreview({
  rule,
  direction,
  value,
  formula,
  type,
  onMarginChange,
  stale
}: DecisionRulePreviewProps): ReactElement {
  return (
    <div className={cn('space-y-3 transition-opacity', stale && 'opacity-50')}>
      <div>
        <h3 className="text-sm font-medium">Treatment effect</h3>
        <p className="text-xs text-muted-foreground">
          {type === 'continuous' ? 'Mean difference' : 'Odds ratio'} and {rule.type} margin
        </p>
      </div>

      <div className="h-40 rounded-lg border bg-muted/20 p-2">
        <DecisionChart
          rule={rule}
          direction={direction}
          value={value}
          type={type}
          onMarginChange={onMarginChange}
        />
      </div>

      {/* The curve is an illustration around the target effect, so say
          what the shading stands for and which way the rule reads it */}
      <p className="text-xs text-muted-foreground">
        Shaded: the probability in the rule. The {rule.type} rule is met when it is{' '}
        <strong className="font-medium text-foreground">
          {rule.type === 'futility' ? 'below' : 'above'} {rule.threshold}
        </strong>
        .
      </p>

      {onMarginChange && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MoveHorizontal className="h-3 w-3" />
          Drag the chart to adjust the margin
        </p>
      )}

      <div className="rounded-lg border bg-muted/50 px-3 py-2">
        <div className="text-xs text-muted-foreground">Decision rule</div>

        <div className="mt-0.5 font-mono text-sm font-semibold">{formula}</div>
      </div>
    </div>
  )
}
