import { JSX } from 'react'
import { Button } from '@/components/ui/button'
import type { BatssRunResult } from '@shared/batss-types'
import { SummaryTable } from './summary-table'
import { BatssChart } from './results-chart'

export function Results({
  result,
  onClose
}: {
  result: BatssRunResult
  onClose: () => void
}): JSX.Element {
  return (
    <div className="space-y-6 text-foreground">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Simulation Results</h2>

        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {result.table && <SummaryTable rows={result.table} />}

      {result.chart && <BatssChart data={result.chart} />}
    </div>
  )
}
