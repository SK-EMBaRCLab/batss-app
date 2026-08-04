import { JSX } from 'react'

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { BatssChartRow } from '@shared/batss-types'

const chartConfig = {
  superior: {
    label: 'B Superior',
    color: 'var(--chart-2)'
  },
  inconclusive: {
    label: 'Inconclusive',
    color: 'oklch(0.62 0 0)'
  }
} satisfies ChartConfig

export function BatssChart({
  data,
  showRefLines
}: {
  data: BatssChartRow[]
  showRefLines: boolean
}): JSX.Element {
  const chartData = ['H0', 'H1'].map((scenario) => ({
    scenario,
    superior:
      data.find((x) => x.Scenario === scenario && x.Outcome === 'B Superior')?.Proportion ?? 0,
    inconclusive:
      data.find((x) => x.Scenario === scenario && x.Outcome === 'Inconclusive')?.Proportion ?? 0
  }))

  return (
    <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
      <BarChart data={chartData}>
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

        {showRefLines && (
          <>
            <ReferenceLine
              y={0.05}
              stroke="var(--destructive)"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: 'Type I Error Target (5%)',
                position: 'insideTopRight',
                fill: 'var(--destructive)',
                fontSize: 12
              }}
            />
            <ReferenceLine
              y={0.8}
              stroke="var(--chart-3)"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: 'Power Target (80%)',
                position: 'insideTopRight',
                fill: 'var(--chart-3)',
                fontSize: 12
              }}
            />
          </>
        )}

        <Bar dataKey="superior" stackId="a" fill="var(--color-superior)" />

        <Bar dataKey="inconclusive" stackId="a" fill="var(--color-inconclusive)" />
      </BarChart>
    </ChartContainer>
  )
}
