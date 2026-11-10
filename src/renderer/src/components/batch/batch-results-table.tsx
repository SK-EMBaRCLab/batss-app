import type { BatchRunEntry } from '@shared/batch-types'
import { type ReactElement, useMemo } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatRunDuration } from '@/lib/run-format'
import { runResultDetail, runStatusLabel } from '@/lib/run-status'
import { useDesign } from '@/stores/design'

/** The batch's finished rows; each opens its saved result. */
export function BatchResultsTable({ entries }: { entries: BatchRunEntry[] }): ReactElement {
  const results = useDesign((s) => s.design?.results)
  const openResults = useDesign((s) => s.openResults)

  // A BatchRunEntry doesn't carry the id design.appendResult() gave its
  // result, so each is matched by createdAt, which stores/batch.ts passes
  // through unchanged. Looked up once per change, not once per row.
  const resultIds = useMemo(
    () => new Map((results ?? []).map((result) => [result.createdAt, result.id])),
    [results]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Row</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {entries.map((entry) => {
          const id = resultIds.get(entry.createdAt)
          const open = (): void => {
            if (id) openResults([id])
          }

          return (
            <TableRow
              key={entry.rowIndex}
              onClick={open}
              // Reachable and openable from the keyboard, not just by click
              tabIndex={id ? 0 : undefined}
              onKeyDown={(event) => {
                if (id && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  open()
                }
              }}
              className={
                id
                  ? 'cursor-pointer outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring'
                  : undefined
              }
            >
              <TableCell>{entry.rowIndex + 1}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <RunStatusIcon status={entry.result.status} />
                  {runStatusLabel(entry.result.status)}
                </span>
              </TableCell>
              <TableCell>{formatRunDuration(entry.result.durationMs) ?? '—'}</TableCell>
              <TableCell>{runResultDetail(entry.result)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
