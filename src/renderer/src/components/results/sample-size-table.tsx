import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { SampleSizeData, SampleSizeScenario } from '@shared/simulation-types'
import { useMemo, useState, type ReactElement } from 'react'
import { Slider } from '../ui/slider'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'

type SampleSizeStats = {
  mean: number
  quantile: number
  minimum: number
  maximum: number
}

type ScenarioStats = {
  total: SampleSizeStats
  control: SampleSizeStats
  experimental: SampleSizeStats
}

function calculateStats(values: number[], q: number): SampleSizeStats {
  if (values.length === 0) {
    return {
      mean: 0,
      quantile: 0,
      minimum: 0,
      maximum: 0
    }
  }

  const sorted = [...values].sort((a, b) => a - b)

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length

  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)

  const quantile =
    lower === upper
      ? sorted[lower]
      : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)

  return {
    mean,
    quantile,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1]
  }
}

function calculateScenarioStats(scenario: SampleSizeScenario, q: number): ScenarioStats {
  const total = scenario.control.map((value, index) => value + scenario.experimental[index])
  return {
    total: calculateStats(total, q),
    control: calculateStats(scenario.control, q),
    experimental: calculateStats(scenario.experimental, q)
  }
}

function ScenarioTable({
  title,
  stats,
  quantile
}: {
  title: string
  stats: ReturnType<typeof calculateScenarioStats>
  quantile: number
}): ReactElement {
  const rows = [
    { label: 'Total', stats: stats.total },
    { label: 'Control', stats: stats.control },
    { label: 'Experimental', stats: stats.experimental }
  ]
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4" />
              <TableHead className="text-right"> Mean </TableHead>
              <TableHead className="text-right"> {quantile.toFixed(2)} Quantile </TableHead>
              <TableHead className="text-right"> Minimum </TableHead>
              <TableHead className="px-4 text-right"> Maximum </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ label, stats }) => (
              <TableRow key={label}>
                <TableCell className="px-4 font-medium"> {label} </TableCell>
                <TableCell className="text-right tabular-nums"> {stats.mean.toFixed(0)} </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats.quantile.toFixed(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats.minimum.toFixed(0)}
                </TableCell>
                <TableCell className="px-4 text-right tabular-nums">
                  {stats.maximum.toFixed(0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export function SampleSizeTable({ sampleSize }: { sampleSize: SampleSizeData }): ReactElement {
  const [quantile, setQuantile] = useState(0.5)
  const h0Stats = useMemo(
    () => calculateScenarioStats(sampleSize.H0, quantile),
    [sampleSize.H0, quantile]
  )
  const h1Stats = useMemo(
    () => calculateScenarioStats(sampleSize.H1, quantile),
    [sampleSize.H1, quantile]
  )

  return (
    <div className="space-y-8">
      {/* Quantile control */}
      <div className="mx-auto w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="slider-quantile" className="text-sm font-medium">
              Quantile
            </Label>
            <p className="text-xs text-muted-foreground">Select the quantile to display</p>
          </div>

          <span className="text-sm font-medium tabular-nums">{quantile.toFixed(2)}</span>
        </div>

        <Slider
          id="slider-quantile"
          value={quantile}
          onValueChange={(value) => setQuantile(value as number)}
          min={0}
          max={1}
          step={0.05}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>0.5</span>
          <span>1</span>
        </div>
      </div>
      <ScenarioTable title="Null Effect Scenario" stats={h0Stats} quantile={quantile} />
      <Separator className="h-0.5" />
      <ScenarioTable title="Target Treatment Effect Scenario" stats={h1Stats} quantile={quantile} />
    </div>
  )
}
