import type { Direction } from '@shared/effect-direction'
import type { DecisionRule, OutcomeType } from '@shared/simulation-types'
import { MoveHorizontal } from 'lucide-react'
import { type ReactElement } from 'react'

import {
  DECISION_CHART_COLOURS,
  DECISION_SHADING_OPACITY,
  OUTCOME_COLOUR_NAMES,
  OUTCOME_COLOURS,
  RULE_OUTCOME
} from '@/lib/outcome-colours'
import { cn } from '@/lib/utils'

import { DecisionChart } from './decision-rule-chart'

// A dot in a chart mark's colour, after the word naming it. It uses the
// same CSS variable as the chart, so it follows the light or dark theme.
function ColourDot({ colour, opacity }: { colour: string; opacity?: number }): ReactElement {
  return (
    <span
      aria-hidden="true"
      className="mx-0.5 inline-block size-2 rounded-full align-middle"
      style={{ backgroundColor: colour, opacity }}
    />
  )
}

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
  const typeText = type === 'continuous' ? 'mean difference' : 'odds ratio'
  // The side of the margin the rule's probability is on, as in its formula
  const sideText = direction === 'less' ? 'less than' : 'greater than'
  const outcome = RULE_OUTCOME[rule.type]
  const { distribution, margin } = DECISION_CHART_COLOURS
  return (
    <div className={cn('space-y-3 transition-opacity', stale && 'opacity-50')}>
      <div>
        <h3 className="text-sm font-medium">Treatment effect</h3>
        <p className="text-xs text-muted-foreground">
          Treatment effect distribution in {distribution.name}
          <ColourDot colour={distribution.colour} />; {rule.type} margin in {margin.name}
          <ColourDot colour={margin.colour} />
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
        The probability that the{' '}
        <strong className="font-medium text-foreground">
          {typeText} is {sideText} {rule.margin}
        </strong>{' '}
        is shaded in {OUTCOME_COLOUR_NAMES[outcome]}
        <ColourDot colour={OUTCOME_COLOURS[outcome]} opacity={DECISION_SHADING_OPACITY} />. The{' '}
        {rule.type} rule is met when it is{' '}
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
