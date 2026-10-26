import type {
  BatchPreparedInput,
  BatchRunEntry,
  BatchStatus,
  BatchUpdate
} from '@shared/batch-types'
import { create } from 'zustand'

import { toast } from '@/components/ui/toast'
import { type DurationEstimate, estimateSimulationDuration } from '@/lib/duration-estimate'
import { appendLogs, subscribeLogs } from '@/lib/log-buffer'
import { type RunStage, withLogLines } from '@/lib/run-progress'

import { useNavigation } from './navigation'
import { requestFailed, runWithEngine } from './run-session'

type BatchState = {
  status: BatchStatus
  message: string
  completed: number
  total: number
  entries: BatchRunEntry[]
  logs: string[]
  // Staged progress for whichever row is currently running — reset at
  // the start of each row (see onUpdate below), same mechanism as the
  // single-simulation progress bar in stores/simulation.ts.
  stage: RunStage | null
  stageStartedAt: number | null
  rowEstimate: DurationEstimate | null

  start: (inputs: BatchPreparedInput[]) => Promise<void>
  cancel: () => Promise<void>
  reset: () => void
}

export const useBatch = create<BatchState>((set) => ({
  status: 'idle',
  message: '',
  completed: 0,
  total: 0,
  entries: [],
  logs: [],
  stage: null,
  stageStartedAt: null,
  rowEstimate: null,

  start: (inputs) =>
    runWithEngine(
      'batch',
      (message) => set({ status: 'error', message }),
      async (session) => {
        const cpuCount = await session.cpuCount()

        set({
          status: 'running',
          entries: [],
          logs: [],
          completed: 0,
          total: inputs.length,
          stage: null,
          stageStartedAt: null,
          rowEstimate: null
        })

        const teardownLog = subscribeLogs(window.batch.onLog, (lines) =>
          set((state) => withLogLines(state, lines))
        )

        const unsubscribeUpdate = window.batch.onUpdate((update: BatchUpdate) => {
          // Apply the previous row's last log lines first, so a late stage
          // marker can't override the new row's 'init' below
          teardownLog.flush()

          // Set by BatchService just before each row runs — as opposed to the
          // identical completed=0 update sent once up front for "Starting
          // batch of N run(s)"
          const startingRow = update.status === 'running' && update.startingRow === true
          const rowInput = startingRow ? inputs[update.completed]?.input : undefined

          set({
            status: update.status,
            message: update.message,
            completed: update.completed,
            total: update.total,
            ...(startingRow
              ? {
                  stage: 'init' as RunStage,
                  stageStartedAt: Date.now(),
                  rowEstimate: rowInput
                    ? estimateSimulationDuration({ ...rowInput, cpuCount })
                    : null
                }
              : {})
          })
        })

        const unsubscribeRow = window.batch.onRowDone((entry: BatchRunEntry) => {
          // Same for the row that just finished: its last lines (e.g. the
          // "Results" marker) must land before the stage is cleared below
          teardownLog.flush()

          set((state) => ({
            entries: [...state.entries, entry],
            // Brief gap until the next row's onUpdate re-arms this — avoids
            // showing the just-finished row's stage frozen at ~99%.
            stage: null,
            stageStartedAt: null
          }))

          // Rows finishing after another design was opened belong to the
          // old one, so saveResult skips them
          session.saveResult({
            createdAt: entry.createdAt,
            input: entry.input,
            result: entry.result
          })
        })

        try {
          // An IPC failure would otherwise leave the batch "running" for good
          // (same idea as the simulation store)
          const final = await window.batch.run(inputs).catch((error): BatchUpdate => {
            const failure = requestFailed(error, 'batch request', 'The batch stopped unexpectedly.')
            set((state) => ({
              logs: appendLogs(state.logs, [
                `> The batch stopped unexpectedly (${failure.reference}).`
              ])
            }))
            return {
              status: 'error',
              completed: useBatch.getState().completed,
              total: inputs.length,
              message: failure.message
            }
          })
          set({
            status: final.status,
            message: final.message,
            completed: final.completed,
            total: final.total,
            stage: null,
            stageStartedAt: null
          })

          // Off the Batch page, the floating run panel reports the outcome
          // instead (see run-progress-panel.tsx), so don't stack a toast on it
          if (useNavigation.getState().currentView === 'batch') {
            if (final.status === 'done') {
              toast.add({ type: 'success', title: 'Batch finished', description: final.message })
            } else if (final.status === 'cancelled') {
              toast.add({ type: 'info', title: 'Batch cancelled', description: final.message })
            } else if (final.status === 'error') {
              toast.add({ type: 'error', title: 'Batch failed', description: final.message })
            }
          }
        } finally {
          unsubscribeUpdate()
          unsubscribeRow()
          teardownLog()
        }
      }
    ),

  cancel: async () => {
    await window.batch.cancel()
  },

  reset: () =>
    set({
      status: 'idle',
      message: '',
      completed: 0,
      total: 0,
      entries: [],
      logs: [],
      stage: null,
      stageStartedAt: null,
      rowEstimate: null
    })
}))
