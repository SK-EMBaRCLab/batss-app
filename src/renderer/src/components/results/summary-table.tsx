import { SIMULATION_OUTCOMES } from '@shared/design-rules'
import { SimulationSummaryRow } from '@shared/simulation-types'
import type { ReactElement } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

// R leaves out a scenario's value when no simulated trial ended that way
const proportion = (value: number | undefined): string => (value ?? 0).toFixed(3)

export function SummaryTable({ rows }: { rows: SimulationSummaryRow[] }): ReactElement {
  // Always superior, futility, inconclusive, whatever order R gives them in
  const ordered = [...rows].sort(
    (a, b) => SIMULATION_OUTCOMES.indexOf(a.Outcome) - SIMULATION_OUTCOMES.indexOf(b.Outcome)
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trial Outcome</TableHead>
          <TableHead>Null Effect Scenario</TableHead>
          <TableHead>Target Effect Scenario</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {ordered.map((row) => (
          <TableRow key={row.Outcome}>
            <TableCell className="font-bold">{row.Outcome}</TableCell>

            <TableCell>{proportion(row['Null Effect'])}</TableCell>

            <TableCell>{proportion(row['Target Effect'])}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
