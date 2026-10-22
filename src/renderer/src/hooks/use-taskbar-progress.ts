import type { BatchStatus } from '@shared/batch-types'
import { useEffect, useState } from 'react'

import { useRunProgress } from '@/lib/run-progress'
import { useBatch } from '@/stores/batch'
import { useEngine } from '@/stores/engine'
import { useSimulation } from '@/stores/simulation'

type RunOutcome = 'success' | 'error' | 'cancelled'

function batchOutcome(status: BatchStatus): RunOutcome {
  if (status === 'done') return 'success'
  return status === 'cancelled' ? 'cancelled' : 'error'
}

// Mirrors the running simulation/batch onto the taskbar/dock icon
// (flashing and notifications on finish come from run-alerts.ts in
// main). Lives in App rather than on the
// Simulation/Batch pages so it keeps going while the user is elsewhere.
//  - Simulation: the same stage-based estimate as the in-page bar.
//  - Batch: finished rows plus the current row's estimate, so it moves
//    steadily rather than jumping once per row.
//  - Busy with no stage known (e.g. renderer reloaded mid-run, which
//    loses store state but not the engine's): indeterminate.
// A failed run leaves a red bar (Windows only) until the window is
// focused; a cancelled one just clears, since the user did it.
export function useTaskbarProgress(): void {
  const busy = useEngine((s) => s.busy)
  const isBatch = busy === 'batch'

  const simulationStage = useSimulation((s) => s.stage)
  const simulationStageStartedAt = useSimulation((s) => s.stageStartedAt)
  const simulationEstimate = useSimulation((s) => s.estimate)

  const batchStage = useBatch((s) => s.stage)
  const batchStageStartedAt = useBatch((s) => s.stageStartedAt)
  const rowEstimate = useBatch((s) => s.rowEstimate)
  const completed = useBatch((s) => s.completed)
  const total = useBatch((s) => s.total)

  const stage = isBatch ? batchStage : simulationStage

  const stageProgress = useRunProgress({
    stage,
    stageStartedAt: isBatch ? batchStageStartedAt : simulationStageStartedAt,
    estimate: isBatch ? rowEstimate : simulationEstimate,
    done: busy === 'idle'
  })

  // Whole percent, or null for indeterminate. Rounding keeps IPC down
  // to one send per percent instead of one per 250ms tick.
  let percent: number | null = null
  if (isBatch && total > 0) {
    percent = Math.round(((completed + stageProgress / 100) / total) * 100)
  } else if (busy === 'simulation' && stage !== null) {
    percent = Math.round(stageProgress)
  }

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const finish = (outcome: RunOutcome): void => {
      setShowError(outcome === 'error' && !document.hasFocus())
    }

    const unsubscribeSimulation = useSimulation.subscribe((state, prev) => {
      if (state.lastResult && state.lastResult !== prev.lastResult) {
        finish(state.lastResult.status)
      }
    })

    const unsubscribeBatch = useBatch.subscribe((state, prev) => {
      if (prev.status === 'running' && state.status !== 'running') {
        finish(batchOutcome(state.status))
      }
    })

    const clearError = (): void => setShowError(false)
    window.addEventListener('focus', clearError)

    return () => {
      unsubscribeSimulation()
      unsubscribeBatch()
      window.removeEventListener('focus', clearError)
    }
  }, [])

  useEffect(() => {
    if (busy !== 'idle') {
      // Electron treats any value > 1 as indeterminate on every platform
      if (percent === null) window.app.setProgress(2, 'indeterminate')
      else window.app.setProgress(percent / 100, 'normal')
    } else if (showError) {
      window.app.setProgress(1, 'error')
    } else {
      window.app.setProgress(-1, 'normal')
    }
  }, [busy, percent, showError])
}
