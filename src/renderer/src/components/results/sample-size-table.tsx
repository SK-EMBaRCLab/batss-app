import { SCENARIO_OF } from '@shared/design-rules'
import { SampleSizeData } from '@shared/simulation-types'
import { type ReactElement, useId, useMemo, useState } from 'react'

import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { SCENARIO_LABELS } from '@/lib/results-labels'
import { calculateScenarioStats } from '@/lib/sample-size-stats'

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
  const labelId = useId()
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
            <Label id={labelId} className="text-sm font-medium">
              Quantile
            </Label>
            <p className="text-xs text-muted-foreground">Select the quantile to display</p>
          </div>

          <span className="text-sm font-medium tabular-nums">{quantile.toFixed(2)}</span>
        </div>

        <Slider
          // The thumb's name (see CoreUsageField)
          aria-labelledby={labelId}
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
      <ScenarioTable title={SCENARIO_LABELS[SCENARIO_OF.H0]} stats={h0Stats} quantile={quantile} />
      <Separator className="h-0.5" />
      <ScenarioTable title={SCENARIO_LABELS[SCENARIO_OF.H1]} stats={h1Stats} quantile={quantile} />
    </div>
  )
}
