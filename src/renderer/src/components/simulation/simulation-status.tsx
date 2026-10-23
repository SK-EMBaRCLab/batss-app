import type { SimulationRunResult } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import { TechnicalDetails } from '@/components/common/technical-details'
import { Progress } from '@/components/ui/progress'
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds'
import type { DurationEstimate } from '@/lib/duration-estimate'
import { type RunStage, STAGE_LABEL, useRunProgress } from '@/lib/run-progress'
import { runTitle } from '@/lib/run-status'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {!done ? (
          <span>{stage ? STAGE_LABEL[stage] : 'Running the simulation…'}</span>
        ) : lastResult ? (
          <>
            <RunStatusIcon status={lastResult.status} />
            <span>{runTitle('simulation', lastResult.status)}</span>
          </>
        ) : (
          <span>{runTitle('simulation', 'finished')}</span>
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

      <TechnicalDetails logs={logs} failed={failed && !cancelled} />
    </div>
  )
}
