import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { batchOutcome, type RunOutcome, useActiveRunPercent } from '@/hooks/use-active-run-progress'
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds'
import { usePersistentBoolean } from '@/hooks/use-persistent-boolean'
import { STAGE_LABEL } from '@/lib/run-progress'
import { runTitle } from '@/lib/run-status'
import { cn, formatDuration, formatDurationLabel } from '@/lib/utils'
import { useBatch } from '@/stores/batch'
import { useEngine } from '@/stores/engine'
import { useNavigation } from '@/stores/navigation'
import { useSimulation } from '@/stores/simulation'

type RunKind = 'simulation' | 'batch'

type PanelRun = {
  kind: RunKind
  startedAt: number
  endedAt: number | null
}

// How long a successful run's "complete" state stays before hiding itself.
// Failures stay until closed.
const SUCCESS_HIDE_MS = 10_000

// Whether the panel is collapsed to its header, remembered across runs
// and sessions
const COLLAPSED_KEY = 'albatross:run-panel-collapsed'

function pageFor(kind: RunKind): 'simulation' | 'batch' {
  return kind === 'batch' ? 'batch' : 'simulation'
}

function runFromEngine(): PanelRun | null {
  const { busy, startedAt } = useEngine.getState()
  if (busy === 'idle') return null
  return { kind: busy, startedAt: startedAt ? Date.parse(startedAt) : Date.now(), endedAt: null }
}

/**
 * Small floating panel, bottom right, for a simulation or batch running
 * (or just finished) while the user is on another page, like Google
 * Drive's upload panel. The run's own page has the full progress card,
 * so the panel hides there. Collapses to its header; closing it hides it
 * until the next run.
 */
export function RunProgressPanel(): ReactElement | null {
  const currentView = useNavigation((s) => s.currentView)
  const navigate = useNavigation((s) => s.navigate)
  const percent = useActiveRunPercent()

  const simulationStage = useSimulation((s) => s.stage)
  const lastResult = useSimulation((s) => s.lastResult)
  const cancelSimulation = useSimulation((s) => s.cancel)

  const batchStatus = useBatch((s) => s.status)
  const completed = useBatch((s) => s.completed)
  const total = useBatch((s) => s.total)
  const cancelBatch = useBatch((s) => s.cancel)

  const [run, setRun] = useState<PanelRun | null>(runFromEngine)
  const [closed, setClosed] = useState(false)
  const [collapsed, setCollapsed] = usePersistentBoolean(COLLAPSED_KEY, false)
  const elapsed = useElapsedSeconds(run?.startedAt ?? null, run?.endedAt ?? null)

  // Track run start/end from the engine. A run that finishes while the
  // user is on its own page has already been shown there, so the panel
  // doesn't repeat it afterwards (e.g. after the jump to Results).
  useEffect(() => {
    return useEngine.subscribe((state, prev) => {
      if (prev.busy === 'idle' && state.busy !== 'idle') {
        setRun(runFromEngine())
        setClosed(false)
      } else if (prev.busy !== 'idle' && state.busy === 'idle') {
        setRun((current) => (current ? { ...current, endedAt: Date.now() } : current))
        if (useNavigation.getState().currentView === pageFor(prev.busy)) setClosed(true)
      }
    })
  }, [])

  const running = run !== null && run.endedAt === null

  // null while running, or for the moment between the engine going idle
  // and the store recording the result
  let outcome: RunOutcome | null = null
  if (run && !running) {
    if (run.kind === 'simulation') outcome = lastResult?.status ?? null
    else if (batchStatus === 'done' || batchStatus === 'error' || batchStatus === 'cancelled') {
      outcome = batchOutcome(batchStatus)
    }
  }

  useEffect(() => {
    if (outcome !== 'success') return
    const id = window.setTimeout(() => setClosed(true), SUCCESS_HIDE_MS)
    return () => window.clearTimeout(id)
  }, [outcome])

  if (!run || closed || outcome === 'cancelled' || currentView === pageFor(run.kind)) {
    return null
  }

  const isBatch = run.kind === 'batch'
  const title = runTitle(run.kind, running ? 'running' : (outcome ?? 'finished'))

  let detail: string
  if (running) {
    detail = isBatch
      ? total > 0
        ? `Run ${Math.min(completed + 1, total)} of ${total}`
        : 'Starting…'
      : simulationStage
        ? STAGE_LABEL[simulationStage]
        : 'Starting…'
  } else if (isBatch) {
    detail = `${completed} of ${total} runs finished`
  } else if (outcome === 'success' && lastResult?.durationMs != null) {
    detail = `Took ${formatDurationLabel(lastResult.durationMs / 1000)}`
  } else if (outcome === 'error') {
    detail = 'See the Simulation page for details.'
  } else {
    detail = ''
  }

  const action = running
    ? { label: 'Open', view: pageFor(run.kind) }
    : outcome === 'success'
      ? isBatch
        ? { label: 'View runs', view: 'table' as const }
        : { label: 'View results', view: 'results' as const }
      : outcome === 'error'
        ? { label: 'View details', view: pageFor(run.kind) }
        : { label: 'Open', view: pageFor(run.kind) }

  return (
    // Below the toast layer (z-50) so a toast never ends up hidden under it
    <div className="fixed right-4 bottom-4 z-40 w-80 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {outcome ? <RunStatusIcon status={outcome} /> : <Spinner className="shrink-0" />}

        <span role="status" className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>

        {collapsed && running && percent !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">{percent}%</span>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronUp /> : <ChevronDown />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setClosed(true)}>
          <X />
        </Button>
      </div>

      {!collapsed && (
        <div className="space-y-3 px-3 py-3">
          {detail && <p className="text-sm text-muted-foreground">{detail}</p>}

          {(running || outcome === 'success') && (
            <div className="flex items-center gap-2">
              <Progress
                value={running ? percent : 100}
                className={cn('flex-1', running && percent === null && 'animate-pulse')}
              />
              {running && percent !== null && (
                <span className="text-xs text-muted-foreground tabular-nums">{percent}%</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {running ? `${formatDuration(elapsed)} elapsed` : ''}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(action.view)
                  if (!running) setClosed(true)
                }}
              >
                {action.label}
              </Button>
              {running && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void (isBatch ? cancelBatch() : cancelSimulation())}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
