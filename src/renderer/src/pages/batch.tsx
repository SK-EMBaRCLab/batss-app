import { Download, Play, Square, Upload } from 'lucide-react'
import { type ReactElement } from 'react'

import { BatchResultsTable } from '@/components/batch/batch-results-table'
import { LogViewer } from '@/components/common/log-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/toast'
import { useBatchCsv } from '@/hooks/use-batch-csv'
import { buildTemplateCsv } from '@/lib/batch-mapper'
import { saveCsv } from '@/lib/csv'
import { requestFailed } from '@/lib/error-reference'
import { STAGE_LABEL, useRunProgress } from '@/lib/run-progress'
import { useBatch } from '@/stores/batch'
import { useEngine } from '@/stores/engine'

// Invalid rows listed by name; the rest are counted
const MAX_LISTED_ERRORS = 8

export default function Batch(): ReactElement {
  const { fileName, parseError, validations, invalidRows, validInputs, handleFile } = useBatchCsv()

  const status = useBatch((s) => s.status)
  const completed = useBatch((s) => s.completed)
  const total = useBatch((s) => s.total)
  const message = useBatch((s) => s.message)
  const entries = useBatch((s) => s.entries)
  const logs = useBatch((s) => s.logs)
  const stage = useBatch((s) => s.stage)
  const stageStartedAt = useBatch((s) => s.stageStartedAt)
  const rowEstimate = useBatch((s) => s.rowEstimate)
  const start = useBatch((s) => s.start)
  const cancel = useBatch((s) => s.cancel)

  const busy = useEngine((s) => s.busy)
  const isRunning = busy === 'batch'

  const rowProgress = useRunProgress({
    stage,
    stageStartedAt,
    estimate: rowEstimate,
    done: !isRunning
  })

  const saveTemplate = async (): Promise<void> => {
    try {
      await saveCsv('batch-template.csv', buildTemplateCsv())
    } catch (error) {
      const failure = requestFailed(error, 'batch template', 'Try again.')
      toast.add({
        type: 'error',
        title: "Couldn't save the template",
        description: failure.message
      })
    }
  }

  const handleRun = async (): Promise<void> => {
    if (validInputs.length === 0) return
    await start(validInputs)
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-352 flex-col gap-4 p-6">
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

            <Button variant="ghost" onClick={() => void saveTemplate()}>
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
                    {invalidRows.slice(0, MAX_LISTED_ERRORS).map((row) => (
                      <li key={row.rowIndex}>{row.errors[0]}</li>
                    ))}
                    {invalidRows.length > MAX_LISTED_ERRORS && (
                      <li>…and {invalidRows.length - MAX_LISTED_ERRORS} more</li>
                    )}
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
            <Button onClick={handleRun} disabled={validInputs.length === 0 || busy !== 'idle'}>
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

              {isRunning && stage && (
                <div className="space-y-1 pl-4">
                  <div className="text-xs text-muted-foreground">{STAGE_LABEL[stage]}</div>
                  <Progress value={rowProgress} className="h-1.5" />
                </div>
              )}
            </div>
          )}

          {logs.length > 0 && <LogViewer logs={logs} className="h-40" />}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card className="min-h-0 flex-1">
          <CardHeader>
            <CardTitle>Batch Results</CardTitle>
            <CardDescription>
              {entries.length} run(s) completed so far. Click a row to view its full results.
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-0 overflow-auto">
            <BatchResultsTable entries={entries} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
