import { DecisionRule } from '@shared/simulation-types'
import { type ReactElement, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'

type DecisionChartProps = {
  rule: DecisionRule
  value: number
  type: 'binary' | 'continuous' | 'ordinal' | undefined
  onMarginChange?: (margin: number) => void
}

const chartConfig = {
  distribution: {
    label: 'Odds ratio',
    color: 'var(--chart-1)'
  },
  decisionRegion: {
    label: 'Decision region',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig

function normalDensity(x: number, mean: number, standardDeviation: number): number {
  const coefficient = 1 / (standardDeviation * Math.sqrt(2 * Math.PI))

  const exponent = -0.5 * Math.pow((x - mean) / standardDeviation, 2)

  return coefficient * Math.exp(exponent)
}

function getChartType(type: 'binary' | 'continuous' | 'ordinal' | undefined): {
  key: string
  label: string
  x: number
} {
  switch (type) {
    case 'binary':
      return { key: 'oddsRatio', label: 'Odds Ratio', x: 1 }

    case 'continuous':
      return { key: 'meanDiff', label: 'Mean Difference', x: 0 }

    default:
      return { key: 'oddsRatio', label: 'Odds Ratio', x: 1 }
  }
}

export function DecisionChart({
  rule,
  value,
  type,
  onMarginChange
}: DecisionChartProps): ReactElement {
  // Visual spread only — NOT the statistical SE. Scales with the
  // treatment effect itself, not with the margin: moving the decision
  // boundary should pan/zoom the chart, not change how "confident" the
  // curve looks.
  const curveSpread = Math.max(0.1, Math.abs(value) * 0.25)

  // The viewport has to fit both the effect estimate and the margin
  // reference line, with enough padding around each to read clearly.
  const fittedRange = useMemo(() => {
    const padding = Math.max(curveSpread * 4, Math.abs(value - rule.margin) * 0.5)
    const lo = Math.min(value, rule.margin) - padding
    return {
      min: type === 'binary' ? Math.max(0, lo) : lo,
      max: Math.max(value, rule.margin) + padding
    }
  }, [curveSpread, value, rule.margin, type])

  // Frozen while dragging the margin line: refitting to every new margin
  // would shift the axis under the cursor. Refits when the drag ends.
  const [dragRange, setDragRange] = useState<{ min: number; max: number } | null>(null)
  const isDragging = dragRange !== null
  const { min, max } = dragRange ?? fittedRange

  const data = useMemo(() => {
    const points = 200
    const key = getChartType(type).key

    return Array.from({ length: points + 1 }, (_, index) => {
      const x = min + ((max - min) * index) / points

      const distribution = normalDensity(x, value, curveSpread)

      const isDecisionRegion = rule.direction === 'greater' ? x >= rule.margin : x <= rule.margin

      return {
        [key]: x,
        distribution,

        // IMPORTANT:
        // null means Recharts doesn't draw
        // the decision area on this side.
        decisionRegion: isDecisionRegion ? distribution : null
      }
    })
  }, [min, max, curveSpread, value, rule.margin, rule.direction, type])

  const chartType = getChartType(type)

  // Recharts hands us the x-axis value under the cursor as
  // `activeLabel` (since XAxis is numeric) — no manual pixel math
  // needed to turn a mouse position into a margin value.
  const updateMarginFromChart = (chartState: { activeLabel?: string | number }): void => {
    if (!onMarginChange || chartState.activeLabel === undefined) return

    const next = Number(chartState.activeLabel)
    if (!Number.isFinite(next)) return

    // Match the numeric input's own step="0.01" convention.
    onMarginChange(Math.round(next * 100) / 100)
  }

  return (
    // ChartContainer already provides the ResponsiveContainer
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 10,
          bottom: 10
        }}
        style={onMarginChange ? { cursor: isDragging ? 'grabbing' : 'ew-resize' } : undefined}
        onMouseDown={(chartState) => {
          if (!onMarginChange) return
          setDragRange(fittedRange)
          updateMarginFromChart(chartState)
        }}
        onMouseMove={(chartState) => {
          if (!isDragging) return
          updateMarginFromChart(chartState)
        }}
        onMouseUp={() => setDragRange(null)}
        onMouseLeave={() => setDragRange(null)}
      >
        <CartesianGrid vertical={false} className="stroke-muted" />

        <XAxis
          dataKey={chartType.key}
          type="number"
          domain={['dataMin', 'dataMax']}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => Number(value).toFixed(2)}
        />

        <YAxis hide />

        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) {
              return null
            }

            let value = Number.POSITIVE_INFINITY
            if (type === 'binary') {
              value = Number(payload[0]?.payload?.oddsRatio)
            } else if (type === 'continuous') {
              value = Number(payload[0]?.payload?.meanDiff)
            }

            if (!Number.isFinite(value)) {
              return null
            }

            return (
              <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
                <div className="font-medium">{chartType.label}</div>

                <div className="text-muted-foreground">{value.toFixed(2)}</div>
              </div>
            )
          }}
        />

        {/* Light outline of the entire normal distribution */}
        <Area
          type="monotone"
          dataKey="distribution"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.04}
          strokeWidth={2}
        />

        {/* ONLY the decision side is shaded */}
        <Area
          type="monotone"
          dataKey="decisionRegion"
          stroke="none"
          fill="var(--chart-2)"
          fillOpacity={0.55}
        />

        {/* Null odds ratio */}
        <ReferenceLine x={chartType.x} stroke="var(--muted-foreground)" strokeDasharray="4 4" />

        {/* Superiority margin */}
        <ReferenceLine
          x={rule.margin}
          stroke="var(--destructive)"
          strokeWidth={3}
          label={{
            value: `SM = ${rule.margin}`,
            position: 'top'
          }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
