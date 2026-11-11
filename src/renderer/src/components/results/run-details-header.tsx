import { MAX_RUN_NAME_LENGTH, MAX_RUN_NOTES_LENGTH } from '@shared/design-rules'
import { runRScript } from '@shared/r-script'
import type { SimulationResultEntry } from '@shared/simulation-types'
import { ChevronDown, FileCode, FileText, History, Trash2 } from 'lucide-react'
import { type ReactElement, useId, useState } from 'react'

import { EditableInPlaceInput } from '@/components/common/editable-inplace-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { runExportFileName, saveExport } from '@/lib/download'
import { requestFailed } from '@/lib/error-reference'
import { exportRunReport } from '@/lib/report/export-run-report'
import { formatRunDate, formatRunDuration } from '@/lib/run-format'
import { runStatusLabel } from '@/lib/run-status'
import { useDesign, useSelectedEntry } from '@/stores/design'
import { useEngine } from '@/stores/engine'
import { useRuntime } from '@/stores/runtime'

import { ConfirmDeleteRuns } from './confirm-delete-runs'

// The notes' character count shows once this close to the limit
const NOTES_COUNT_FROM = 200

/** The run being viewed: its name, notes, exports and Delete. */
export function RunDetailsHeader(): ReactElement | null {
  const entry = useSelectedEntry()
  if (!entry) return null

  // Keyed by run, so the notes being typed start over on another run
  return <RunDetails key={entry.id} entry={entry} />
}

function RunDetails({ entry }: { entry: SimulationResultEntry }): ReactElement {
  const editResult = useDesign((state) => state.editResult)
  const deleteResults = useDesign((state) => state.deleteResults)
  const designName = useDesign((state) => state.design?.name ?? '')
  const designDescription = useDesign((state) => state.design?.description)
  const appVersion = useRuntime((state) => state.appVersion)
  // Not while a run or batch is adding results
  const engineBusy = useEngine((state) => state.busy)
  const busy = engineBusy !== 'idle'
  const startFromRun = useDesign((state) => state.startFromRun)

  const [confirming, setConfirming] = useState(false)
  const [notes, setNotes] = useState(entry.notes ?? '')
  const notesId = useId()

  const createdAt = formatRunDate(entry.createdAt)
  const duration = formatRunDuration(entry.result.durationMs)
  const details = [entry.name && createdAt, runStatusLabel(entry.result.status), duration]
    .filter(Boolean)
    .join(' · ')

  // Saved to the design once typing stops (on leaving the box), not
  // on every key, so the design isn't marked changed by each one
  const saveNotes = (): void => {
    if (notes.trim() !== (entry.notes ?? '')) editResult(entry.id, { notes })
  }

  // Any run, failed ones too: the script is a way to look into an
  // error in R itself
  const exportRScript = async (): Promise<void> => {
    try {
      const script = runRScript(entry, { designName, designDescription, appVersion })
      await saveExport(
        runExportFileName(designName, 'R script', entry.createdAt, 'R'),
        new Blob([script], { type: 'text/plain;charset=utf-8' })
      )
    } catch (error) {
      const failure = requestFailed(error, 'R script export', 'Try again.')
      toast.add({
        type: 'error',
        title: "Couldn't export the R script",
        description: failure.message
      })
    }
  }

  // Any run: a failed one's report has its design and the error
  const exportReport = async (): Promise<void> => {
    try {
      await exportRunReport(entry, { designName, designDescription, appVersion })
    } catch (error) {
      const failure = requestFailed(error, 'report export', 'Try again.')
      toast.add({
        type: 'error',
        title: "Couldn't export the report",
        description: failure.message
      })
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="sr-only">Results</h1>
            <EditableInPlaceInput
              name={entry.name ?? ''}
              emptyLabel={createdAt}
              maxLength={MAX_RUN_NAME_LENGTH}
              title="Rename run"
              hint="Clear the name to show the run's date"
              onRename={(name) => editResult(entry.id, { name })}
              className="-ml-1.5 h-auto max-w-full text-xl font-semibold"
            />
            <p className="text-sm text-muted-foreground">{details}</p>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {/* Any run, failed ones too: fixing a failed run's settings is a
                common reason to start from it. Not while a simulation runs,
                when the wizard is locked */}
            <Button
              variant="outline"
              size="sm"
              disabled={engineBusy === 'simulation'}
              onClick={() => startFromRun(entry.id)}
            >
              <History />
              Start from this run
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    Export
                    <ChevronDown />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void exportReport()}>
                  <FileText />
                  Word report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportRScript()}>
                  <FileCode />R script
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <Trash2 />
              Delete run
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={notesId}>Notes</Label>
          <Textarea
            id={notesId}
            value={notes}
            maxLength={MAX_RUN_NOTES_LENGTH}
            placeholder="What was this run for?"
            onChange={(event) => setNotes(event.target.value)}
            onBlur={saveNotes}
          />
          {notes.length > MAX_RUN_NOTES_LENGTH - NOTES_COUNT_FROM && (
            <p className="text-right text-xs text-muted-foreground">
              {notes.length}/{MAX_RUN_NOTES_LENGTH}
            </p>
          )}
        </div>
      </CardContent>

      <ConfirmDeleteRuns
        count={1}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => deleteResults([entry.id])}
      />
    </Card>
  )
}
