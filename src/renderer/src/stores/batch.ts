import type {
  BatchPreparedInput,
  BatchRunEntry,
  BatchStatus,
  BatchUpdate
} from '@shared/batch-types'
import { describeBusy } from '@shared/engine-types'
import { create } from 'zustand'

import { toast } from '@/components/ui/toast'
import { type DurationEstimate, estimateSimulationDuration } from '@/lib/duration-estimate'
import { appendLogs, subscribeLogs } from '@/lib/log-buffer'
import { detectRunStage, type RunStage } from '@/lib/run-progress'

import { useDesign } from './design'
import { useEngine } from './engine'

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

  start: async (inputs) => {
    if (!useEngine.getState().tryAcquire('batch')) {
      set({ status: 'error', message: describeBusy(useEngine.getState()) })
      return
    }

    const designId = useDesign.getState().design?.id ?? null
    const cpuCount = await window.app.cpuCount().catch(() => null)

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

    const unsubscribeUpdate = window.batch.onUpdate((update: BatchUpdate) => {
      // BatchService emits this exact message right before executing
      // each row (see batch.service.ts) — the one reliable "a new row
      // is starting" signal, as opposed to the identical completed=0
      // emitted once up front for "Starting batch of N run(s)".
      const startingRow = update.status === 'running' && update.message.startsWith('Running row ')
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
                ? estimateSimulationDuration({
                    N: rowInput.N,
                    m0: rowInput.m0,
                    m: rowInput.m,
                    R: rowInput.R,
                    corePercent: rowInput.corePercent,
                    cpuCount
                  })
                : null
            }
          : {})
      })
    })

    const unsubscribeRow = window.batch.onRowDone((entry: BatchRunEntry) => {
      set((state) => ({
        entries: [...state.entries, entry],
        // Brief gap until the next row's onUpdate re-arms this — avoids
        // showing the just-finished row's stage frozen at ~99%.
        stage: null,
        stageStartedAt: null
      }))
      // Rows finishing after another design was opened belong to the old one.
      if (useDesign.getState().design?.id !== designId) return

      useDesign.getState().appendResult({
        createdAt: entry.createdAt,
        input: entry.input,
        result: entry.result
      })
    })

    const teardownLog = subscribeLogs(window.batch.onLog, (lines) =>
      set((state) => {
        const stageLine = [...lines].reverse().find((line) => detectRunStage(line) !== null)
        const stage = stageLine ? detectRunStage(stageLine) : state.stage

        return {
          logs: appendLogs(state.logs, lines),
          stage,
          stageStartedAt: stage !== state.stage ? Date.now() : state.stageStartedAt
        }
      })
    )

    try {
      const final = await window.batch.run(inputs)
      set({
        status: final.status,
        message: final.message,
        completed: final.completed,
        total: final.total,
        stage: null,
        stageStartedAt: null
      })

      if (final.status === 'done') {
        toast.add({ type: 'success', title: 'Batch finished', description: final.message })
      } else if (final.status === 'cancelled') {
        toast.add({ type: 'info', title: 'Batch cancelled', description: final.message })
      } else if (final.status === 'error') {
        toast.add({ type: 'error', title: 'Batch failed', description: final.message })
      }
    } finally {
      unsubscribeUpdate()
      unsubscribeRow()
      teardownLog()
      useEngine.getState().release()
    }
  },

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
