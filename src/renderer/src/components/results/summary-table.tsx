import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { SimulationSummaryRow } from '@shared/simulation-types'
import type { ReactElement } from 'react'

export function SummaryTable({ rows }: { rows: SimulationSummaryRow[] }): ReactElement {
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
        {rows.map((row) => (
          <TableRow key={row.Outcome}>
            <TableCell className="font-bold">{row.Outcome}</TableCell>

            <TableCell>{row['Null Effect']?.toFixed(3)}</TableCell>

            <TableCell>{row['Target Effect']?.toFixed(3)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
