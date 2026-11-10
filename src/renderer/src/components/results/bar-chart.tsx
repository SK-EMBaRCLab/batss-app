import { SIMULATION_OUTCOMES, SIMULATION_SCENARIOS } from '@shared/design-rules'
import { SimulationChartRow, type SimulationOutcome } from '@shared/simulation-types'
import { type ReactElement } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { OUTCOME_COLOURS } from '@/lib/outcome-colours'
import { hasSuperiorOutcome, POWER_TARGET, TYPE_I_ERROR_TARGET } from '@/lib/results-labels'

// Each outcome's bar, in the order they're stacked
const OUTCOME_KEYS = {
  'Experimental Superior': 'superior',
  Futility: 'futility',
  Inconclusive: 'inconclusive'
} as const satisfies Record<SimulationOutcome, string>

const chartConfig = Object.fromEntries(
  SIMULATION_OUTCOMES.map((outcome) => [
    OUTCOME_KEYS[outcome],
    { label: outcome, color: OUTCOME_COLOURS[outcome] }
  ])
) satisfies ChartConfig

const percent = (share: number): string => `${Math.round(share * 100)}%`

export function ResultsBarChart({
  data,
  showRefLines
}: {
  data: SimulationChartRow[]
  showRefLines: boolean
}): ReactElement {
  const chartData = SIMULATION_SCENARIOS.map((scenario) => ({
    scenario,
    ...Object.fromEntries(
      SIMULATION_OUTCOMES.map((outcome) => [
        OUTCOME_KEYS[outcome],
        data.find((x) => x.Scenario === scenario && x.Outcome === outcome)?.Proportion ?? 0
      ])
    )
  }))

  // Only the outcomes this run produced, so a design without a futility
  // rule doesn't show an empty Futility entry in the legend
  const outcomes = SIMULATION_OUTCOMES.filter((outcome) =>
    data.some((row) => row.Outcome === outcome)
  )

  // Only when trials could stop for superiority, the bar the targets are for
  const referenceLines = showRefLines && hasSuperiorOutcome(data)

  return (
    <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          // Room on the right for the reference lines' labels
          right: referenceLines ? 160 : 20,
          left: 20,
          bottom: 20
        }}
      >
        <CartesianGrid vertical={false} />

        <XAxis dataKey="scenario" />

        <YAxis
          domain={[0, 1]}
          tickFormatter={(value) => `${value * 100}%`}
          label={{
            value: 'Proportion of Simulated Trials',
            angle: -90,
            position: 'insideLeft',
            style: {
              textAnchor: 'middle',
              fill: 'var(--muted-foreground)',
              fontSize: 12
            }
          }}
        />

        <ChartTooltip content={<ChartTooltipContent />} />

        <ChartLegend content={<ChartLegendContent />} />

        {referenceLines && (
          <>
            <ReferenceLine
              y={TYPE_I_ERROR_TARGET}
              stroke="var(--destructive)"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `Type I Error Target (${percent(TYPE_I_ERROR_TARGET)})`,
                position: 'right',
                fill: 'var(--destructive)',
                fontSize: 12
              }}
            />
            <ReferenceLine
              y={POWER_TARGET}
              stroke="var(--chart-3)"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `Power Target (${percent(POWER_TARGET)})`,
                position: 'right',
                fill: 'var(--chart-3)',
                fontSize: 12
              }}
            />
          </>
        )}

        {outcomes.map((outcome) => (
          <Bar
            key={outcome}
            dataKey={OUTCOME_KEYS[outcome]}
            stackId="a"
            fill={`var(--color-${OUTCOME_KEYS[outcome]})`}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
