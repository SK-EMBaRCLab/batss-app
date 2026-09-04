import type { DecisionRule } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import { OddsRatioDecisionChart } from './decision-rule-chart'

type DecisionRulePreviewProps = {
  rule: DecisionRule
  oddsRatio: number
  formula: string
}

export function DecisionRulePreview({
  rule,
  oddsRatio,
  formula
}: DecisionRulePreviewProps): ReactElement {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Treatment effect</h3>
        <p className="text-xs text-muted-foreground">Estimated odds ratio and decision margin</p>
      </div>

      <div className="h-40 rounded-lg border bg-muted/20 p-2">
        <OddsRatioDecisionChart rule={rule} oddsRatio={oddsRatio} />
      </div>

      <div className="rounded-lg border bg-muted/50 px-3 py-2">
        <div className="text-xs text-muted-foreground">Decision rule</div>

        <div className="mt-0.5 font-mono text-sm font-semibold">{formula}</div>
      </div>
    </div>
  )
}
