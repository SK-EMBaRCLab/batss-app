import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { BatssSummaryRow } from '@shared/batss-types'
import type { JSX } from 'react'

export function SummaryTable({ rows }: { rows: BatssSummaryRow[] }): JSX.Element {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Outcome</TableHead>
          <TableHead>H0 proportions</TableHead>
          <TableHead>H1 proportions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.Outcome}>
            <TableCell className="font-medium">{row.Outcome}</TableCell>

            <TableCell>{row.H0.toFixed(3)}</TableCell>

            <TableCell>{row.H1.toFixed(3)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
