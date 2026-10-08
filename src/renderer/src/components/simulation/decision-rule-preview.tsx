import type { DecisionRule } from '@shared/simulation-types'
import { cn } from 'cn'
import { MoveHorizontal } from 'lucide-react'
import { type ReactElement } from 'react'

import { DecisionChart } from './decision-rule-chart'

type DecisionRulePreviewProps = {
  rule: DecisionRule
  value: number
  formula: string
  type: 'binary' | 'continuous' | 'ordinal' | undefined
  onMarginChange?: (margin: number) => void
  stale?: boolean
}

export function DecisionRulePreview({
  rule,
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
          {type === 'continuous' ? 'Mean difference' : 'Odds ratio'} and decision margin
        </p>
      </div>

      <div className="h-40 rounded-lg border bg-muted/20 p-2">
        <DecisionChart rule={rule} value={value} type={type} onMarginChange={onMarginChange} />
      </div>

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
