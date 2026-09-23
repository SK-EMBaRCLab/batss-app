import type {
  BatchPreparedInput,
  BatchRunEntry,
  BatchStatus,
  BatchUpdate
} from '@shared/batch-types'
import { describeBusy } from '@shared/engine-types'
import { create } from 'zustand'

import { appendLogs, createLogBatcher } from '@/lib/log-buffer'

import { useDesign } from './design'
import { useEngine } from './engine'

type BatchState = {
  status: BatchStatus
  message: string
  completed: number
  total: number
  entries: BatchRunEntry[]
  logs: string[]

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

  start: async (inputs) => {
    if (!useEngine.getState().tryAcquire('batch')) {
      set({ status: 'error', message: describeBusy(useEngine.getState()) })
      return
    }

    set({ status: 'running', entries: [], logs: [], completed: 0, total: inputs.length })

    const unsubscribeUpdate = window.batch.onUpdate((update: BatchUpdate) => {
      set({
        status: update.status,
        message: update.message,
        completed: update.completed,
        total: update.total
      })
    })

    const unsubscribeRow = window.batch.onRowDone((entry: BatchRunEntry) => {
      set((state) => ({ entries: [...state.entries, entry] }))
      useDesign.getState().appendResult({
        createdAt: entry.createdAt,
        input: entry.input,
        result: entry.result
      })
    })

    const batcher = createLogBatcher((lines) =>
      set((state) => ({ logs: appendLogs(state.logs, lines) }))
    )
    const unsubscribeLog = window.batch.onLog(batcher.push)

    try {
      const final = await window.batch.run(inputs)
      set({
        status: final.status,
        message: final.message,
        completed: final.completed,
        total: final.total
      })
    } finally {
      unsubscribeUpdate()
      unsubscribeRow()
      unsubscribeLog()
      batcher.flush()
      useEngine.getState().release()
    }
  },

  cancel: async () => {
    await window.batch.cancel()
  },

  reset: () => set({ status: 'idle', message: '', completed: 0, total: 0, entries: [], logs: [] })
}))
