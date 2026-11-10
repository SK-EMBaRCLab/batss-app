import { SIMULATION_SCENARIOS } from '@shared/design-rules'
import { SimulationChartRow, type SimulationOutcome } from '@shared/simulation-types'
import { type ReactElement } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  type TooltipContentProps,
  XAxis,
  YAxis
} from 'recharts'

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

// Each outcome's bar
const OUTCOME_KEYS = {
  'Experimental Superior': 'superior',
  Futility: 'futility',
  Inconclusive: 'inconclusive'
} as const satisfies Record<SimulationOutcome, string>

// Stacked from the bottom up: superiority at the bottom, futility on
// top. The legend lists them in this order
const STACK_ORDER = [
  'Experimental Superior',
  'Inconclusive',
  'Futility'
] as const satisfies readonly SimulationOutcome[]

const chartConfig = Object.fromEntries(
  STACK_ORDER.map((outcome) => [
    OUTCOME_KEYS[outcome],
    { label: outcome, color: OUTCOME_COLOURS[outcome] }
  ])
) satisfies ChartConfig

// The outcomes listed as they're stacked, read from the top down.
// Recharts hands the tooltip the bars bottom first, and its itemSorter
// only applies to its own tooltip, not this one
function TopDownTooltipContent({ active, label, payload }: TooltipContentProps): ReactElement {
  return <ChartTooltipContent active={active} label={label} payload={[...payload].reverse()} />
}

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
      STACK_ORDER.map((outcome) => [
        OUTCOME_KEYS[outcome],
        data.find((x) => x.Scenario === scenario && x.Outcome === outcome)?.Proportion ?? 0
      ])
    )
  }))

  // The outcomes this run produced, so a design without a futility rule
  // has no empty Futility entry in the legend or tooltip
  const produced = (outcome: SimulationOutcome): boolean =>
    data.some((row) => row.Outcome === outcome)

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

        <ChartTooltip content={TopDownTooltipContent} />

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
            {/* The text colour: green, the old colour, is now the
                superior bar's */}
            <ReferenceLine
              y={POWER_TARGET}
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `Power Target (${percent(POWER_TARGET)})`,
                position: 'right',
                fill: 'var(--foreground)',
                fontSize: 12
              }}
            />
          </>
        )}

        {/* Every outcome's bar, always, even one this run didn't produce
            (it's 0 high, and kept out of the legend and tooltip). Recharts
            stacks bars in the order they're added to the chart, not the
            order written here: leaving one out would add it last, on top
            of the stack, when switching to a run that has it. */}
        {STACK_ORDER.map((outcome) => (
          <Bar
            key={outcome}
            dataKey={OUTCOME_KEYS[outcome]}
            stackId="a"
            fill={`var(--color-${OUTCOME_KEYS[outcome]})`}
            legendType={produced(outcome) ? 'rect' : 'none'}
            tooltipType={produced(outcome) ? undefined : 'none'}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
