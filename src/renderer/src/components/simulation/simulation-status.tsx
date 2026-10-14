import type { SimulationRunResult } from '@shared/simulation-types'
import { ChevronDown, CircleCheck, CircleSlash, TriangleAlert } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { LogViewer } from '@/components/common/log-viewer'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import type { DurationEstimate } from '@/lib/duration-estimate'
import { type RunStage, STAGE_LABEL, useRunProgress } from '@/lib/run-progress'
import { formatDuration, formatDurationLabel } from '@/lib/utils'

import { RunSteps } from './run-steps'

type SimulationStatusProps = {
  logs: string[]
  startedAt: number | null
  endedAt: number | null
  stage: RunStage | null
  stageStartedAt: number | null
  estimate: DurationEstimate | null
  lastResult: SimulationRunResult | null
}

function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || endedAt !== null) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt, endedAt])

  if (startedAt === null) return 0
  return ((endedAt ?? now) - startedAt) / 1000
}

/**
 * A plain-language view of what's happening during (and right after) a
 * simulation run, built for people who aren't going to read raw R/INLA
 * console output. The actual output is still available — see the
 * "Technical details" disclosure at the bottom — but it's no longer
 * the first thing a user sees.
 */
export function SimulationStatus({
  logs,
  startedAt,
  endedAt,
  stage,
  stageStartedAt,
  estimate,
  lastResult
}: SimulationStatusProps): ReactElement {
  const elapsed = useElapsedSeconds(startedAt, endedAt)
  const done = endedAt !== null
  const progress = useRunProgress({ stage, stageStartedAt, estimate, done })

  const failed = done && lastResult !== null && lastResult.status !== 'success'
  const cancelled = done && lastResult?.status === 'cancelled'

  const [detailsOpen, setDetailsOpen] = useState(false)

  // Jump the raw output open automatically on failure — same reasoning
  // as RuntimeScreen: that's exactly what a support contact will need.
  useEffect(() => {
    if (failed && !cancelled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailsOpen(true)
    }
  }, [failed, cancelled])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {!done && <span>{stage ? STAGE_LABEL[stage] : 'Running the simulation…'}</span>}

        {done && !failed && (
          <>
            <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>Simulation complete</span>
          </>
        )}

        {done && cancelled && (
          <>
            <CircleSlash className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Simulation cancelled</span>
          </>
        )}

        {done && failed && !cancelled && (
          <>
            <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
            <span>Something went wrong</span>
          </>
        )}
      </div>

      <RunSteps stage={stage} done={done} failed={failed} />

      <Progress value={done ? (failed ? progress : 100) : progress} />

      <p className="text-xs text-muted-foreground">
        {done
          ? lastResult?.durationMs != null
            ? `Took ${formatDurationLabel(lastResult.durationMs / 1000)}`
            : null
          : `Elapsed: ${formatDuration(elapsed)}`}
      </p>

      {failed && !cancelled && lastResult && 'message' in lastResult && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {lastResult.message}
        </div>
      )}

      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="flex text-muted-foreground">
              <ChevronDown
                className={`mr-1 h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              />
              Technical details
            </Button>
          }
        />

        <CollapsibleContent>
          <LogViewer logs={logs} className="mt-2 h-48" />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
