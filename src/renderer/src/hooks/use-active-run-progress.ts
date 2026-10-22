import type { BatchStatus } from '@shared/batch-types'

import { useRunProgress } from '@/lib/run-progress'
import { useBatch } from '@/stores/batch'
import { useEngine } from '@/stores/engine'
import { useSimulation } from '@/stores/simulation'

export type RunOutcome = 'success' | 'error' | 'cancelled'

export function batchOutcome(status: BatchStatus): RunOutcome {
  if (status === 'done') return 'success'
  return status === 'cancelled' ? 'cancelled' : 'error'
}

/**
 * Whole-percent progress of whatever the engine is running, shared by
 * the taskbar progress and the floating run panel so both agree.
 *  - Simulation: the same stage-based estimate as the in-page bar.
 *  - Batch: finished rows plus the current row's estimate, so it moves
 *    steadily rather than jumping once per row.
 *  - null when idle, or busy with no stage known (e.g. the renderer
 *    reloaded mid-run, which loses store state but not the engine's).
 */
export function useActiveRunPercent(): number | null {
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

  // Rounded so consumers (e.g. taskbar IPC) only update once per percent
  // rather than on every 250ms tick.
  if (isBatch && total > 0) {
    return Math.round(((completed + stageProgress / 100) / total) * 100)
  }
  if (busy === 'simulation' && stage !== null) {
    return Math.round(stageProgress)
  }
  return null
}
