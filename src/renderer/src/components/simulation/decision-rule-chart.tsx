import { DecisionRule } from '@shared/simulation-types'
import { type ReactElement, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'

type DecisionChartProps = {
  rule: DecisionRule
  value: number
  type: 'binary' | 'continuous' | 'ordinal' | undefined
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

export function DecisionChart({ rule, value, type }: DecisionChartProps): ReactElement {
  const data = useMemo(() => {
    // This is only visual spread.
    // It is NOT the statistical SE.
    const spread = Math.max(0.25, Math.abs(value - rule.margin) / 3)
    const lo = Math.min(value, rule.margin) - 3 * spread
    const min = type === 'binary' ? Math.max(0, lo) : lo
    const max = Math.max(value, rule.margin) + 3 * spread

    const points = 200

    return Array.from({ length: points + 1 }, (_, index) => {
      const x = min + ((max - min) * index) / points

      const distribution = normalDensity(x, value, spread)

      const isDecisionRegion = rule.direction === 'greater' ? x >= rule.margin : x <= rule.margin

      if (type === 'binary') {
        return {
          oddsRatio: x,
          distribution,

          // IMPORTANT:
          // null means Recharts doesn't draw
          // the decision area on this side.
          decisionRegion: isDecisionRegion ? distribution : null
        }
      }

      return {
        meanDiff: x,
        distribution,

        // IMPORTANT:
        // null means Recharts doesn't draw
        // the decision area on this side.
        decisionRegion: isDecisionRegion ? distribution : null
      }
    })
  }, [value, rule.margin, rule.direction, type])

  const chartType = getChartType(type)

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 10
          }}
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
      </ResponsiveContainer>
    </ChartContainer>
  )
}
