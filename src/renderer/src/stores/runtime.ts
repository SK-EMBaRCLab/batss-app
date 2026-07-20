import { create } from 'zustand'
import type { RuntimeStatus, RuntimeUpdate, RuntimePackage } from '../../../shared/runtime-types'

// Keep only the most recent N log lines in memory. A full source build
// (fmesher, sf, etc.) can produce thousands of compiler lines; nothing
// downstream needs more than a scrollback window of recent output.
const MAX_LOG_LINES = 2000

type RuntimeState = {
  status: RuntimeStatus
  message: string
  progress: number
  packages: RuntimePackage[]
  logs: string[]
  error?: string
  initialized: boolean

  initialize: () => Promise<void>
  clearLogs: () => void
}

export const useRuntime = create<RuntimeState>((set, get) => ({
  status: 'idle',
  message: '',
  progress: 0,
  packages: [],
  logs: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) {
      return
    }

    set({
      initialized: true,
      status: 'checking',
      message: 'Starting runtime check',
      logs: []
    })

    // Subscribe before invoking check() so no events can be missed in
    // the (unlikely but possible) window between the invoke call being
    // sent and the listeners being attached.
    const unsubscribeUpdate = window.runtime.onUpdate((update: RuntimeUpdate) => {
      set({
        status: update.status,
        message: update.message,
        progress: update.progress
      })
    })

    const unsubscribeLog = window.runtime.onLog((line: string) => {
      set((state) => ({
        logs:
          state.logs.length >= MAX_LOG_LINES
            ? [...state.logs.slice(state.logs.length - MAX_LOG_LINES + 1), line]
            : [...state.logs, line]
      }))
    })

    try {
      const result = await window.runtime.check()

      set({
        status: result.ready ? 'ready' : 'error',
        message: result.ready ? 'Runtime ready' : 'One or more packages failed to install',
        progress: 100,
        packages: result.packages,
        error: result.ready ? undefined : 'R and BATSS are required to run simulations.'
      })
    } catch (error) {
      set({
        status: 'error',
        message: error instanceof Error ? error.message : 'Runtime failed',
        error: error instanceof Error ? error.message : 'Runtime failed'
      })
    } finally {
      unsubscribeUpdate()
      unsubscribeLog()
    }
  },

  clearLogs: () => set({ logs: [] })
}))
