import type { BatchRowValidation } from '@shared/batch-types'
import { Download, Play, Square, Upload } from 'lucide-react'
import { type ChangeEvent, type ReactElement, useMemo, useState } from 'react'

import { LogViewer } from '@/components/common/log-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { buildBatchValidations, buildTemplateCsv } from '@/lib/batch-mapper'
import { downloadCsv, parseCsvFile } from '@/lib/csv'
import { useBatch } from '@/stores/batch'
import { useDesign } from '@/stores/design'
import { useEngine } from '@/stores/engine'

export default function Batch(): ReactElement {
  const design = useDesign((s) => s.design)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [validations, setValidations] = useState<BatchRowValidation[]>([])

  const status = useBatch((s) => s.status)
  const completed = useBatch((s) => s.completed)
  const total = useBatch((s) => s.total)
  const message = useBatch((s) => s.message)
  const entries = useBatch((s) => s.entries)
  const logs = useBatch((s) => s.logs)
  const start = useBatch((s) => s.start)
  const cancel = useBatch((s) => s.cancel)

  const busy = useEngine((s) => s.busy)
  const isRunning = busy === 'batch'

  const invalidRows = useMemo(
    () =>
      validations.filter(
        (v): v is Extract<BatchRowValidation, { status: 'invalid' }> => v.status === 'invalid'
      ),
    [validations]
  )

  const validInputs = useMemo(
    () =>
      validations
        .filter((v): v is Extract<BatchRowValidation, { status: 'valid' }> => v.status === 'valid')
        .map((v) => ({ rowIndex: v.rowIndex, input: v.input })),
    [validations]
  )

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    setParseError(null)
    setFileName(file.name)

    try {
      const parsed = await parseCsvFile(file)

      if (parsed.rows.length === 0) {
        setParseError('The CSV has no data rows.')
        setValidations([])
        return
      }

      setValidations(buildBatchValidations(parsed.rows))
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse CSV')
      setValidations([])
    }
  }

  const handleRun = async (): Promise<void> => {
    if (validInputs.length === 0) return
    await start(validInputs)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Processing</CardTitle>
          <CardDescription>
            Upload a CSV where each row is a complete simulation to run — every column is read
            directly from the file.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" render={<label />} nativeButton={false}>
              <Upload className="mr-2 h-4 w-4" />
              {fileName ?? 'Upload CSV'}
              <input type="file" accept=".csv" className="sr-only" onChange={handleFile} />
            </Button>

            <Button
              variant="ghost"
              onClick={() => downloadCsv('batch-template.csv', buildTemplateCsv())}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV template
            </Button>

            {validations.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {validations.length} row(s) loaded
              </span>
            )}
          </div>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {validations.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              {invalidRows.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium text-destructive">
                    {invalidRows.length} of {validations.length} row(s) failed validation and will
                    be skipped:
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5 text-destructive/90">
                    {invalidRows.slice(0, 8).map((row) => (
                      <li key={row.rowIndex}>{row.errors[0]}</li>
                    ))}
                    {invalidRows.length > 8 && <li>…and {invalidRows.length - 8} more</li>}
                  </ul>
                </div>
              ) : (
                <p className="text-primary">
                  All {validations.length} row(s) are valid and ready to run.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={validInputs.length === 0 || busy !== 'idle' || !design}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Batch ({validInputs.length})
            </Button>

            {isRunning && (
              <Button variant="destructive" onClick={() => cancel()}>
                <Square className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>

          {!design && (
            <p className="text-sm text-muted-foreground">
              Open or create a study design first — batch results are saved into it.
            </p>
          )}

          {busy === 'simulation' && (
            <p className="text-sm text-muted-foreground">
              A simulation is currently running. Wait for it to finish before starting a batch.
            </p>
          )}

          {status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{message}</span>
                <span className="text-muted-foreground">
                  {completed}/{total}
                </span>
              </div>
              <Progress value={total > 0 ? (completed / total) * 100 : 0} />
            </div>
          )}

          {logs.length > 0 && <LogViewer logs={logs} className="h-40" />}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card className="min-h-0 flex-1">
          <CardHeader>
            <CardTitle>Batch Results</CardTitle>
            <CardDescription>{entries.length} run(s) completed so far.</CardDescription>
          </CardHeader>

          <CardContent className="min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.rowIndex}>
                    <TableCell>{entry.rowIndex + 1}</TableCell>
                    <TableCell>{entry.result.status === 'success' ? 'Success' : 'Error'}</TableCell>
                    <TableCell>
                      {entry.result.status === 'success'
                        ? `BATSS v${entry.result.package}`
                        : entry.result.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
