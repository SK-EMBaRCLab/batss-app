import { create } from 'zustand'

import type { RuntimePackage, RuntimeStatus, RuntimeUpdate } from '../../../shared/runtime-types'

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
  appVersion: string
  loadAppVersion: () => Promise<void>

  initialize: () => Promise<void>
  checkRuntime: () => Promise<void>
  updatePackages: () => Promise<void>
  clearLogs: () => void
}

// Runs a tracked runtime operation (initial check or package update):
// subscribes to the live update/log channels, runs `operation`, maps
// the resulting RuntimeResult into store state, and always cleans up
// the subscriptions - regardless of success, R-level failure, or a
// rejected IPC call. checkRuntime and updatePackages previously
// duplicated this wiring; both now just describe what makes them
// different (the operation itself and the ready/failure messages).
async function runTrackedOperation(
  set: (partial: Partial<RuntimeState> | ((state: RuntimeState) => Partial<RuntimeState>)) => void,
  operation: () => Promise<{ ready: boolean; packages: RuntimePackage[] }>,
  messages: { ready: string; failed: string }
): Promise<void> {
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
    const result = await operation()

    set({
      status: result.ready ? 'ready' : 'error',
      message: result.ready ? messages.ready : messages.failed,
      progress: 100,
      packages: result.packages,
      error: result.ready
        ? undefined
        : `${messages.failed}: ${result.packages
            .filter((p) => !p.installed)
            .map((p) => p.name)
            .join(', ')}`
    })
  } catch (error) {
    set({
      status: 'error',
      message: error instanceof Error ? error.message : messages.failed,
      error: error instanceof Error ? error.message : messages.failed
    })
  } finally {
    unsubscribeUpdate()
    unsubscribeLog()
  }
}

export const useRuntime = create<RuntimeState>((set, get) => ({
  status: 'idle',
  message: '',
  progress: 0,
  packages: [],
  logs: [],
  initialized: false,
  appVersion: '',

  initialize: async () => {
    if (get().initialized) {
      return
    }
    set({ initialized: true })
    await get().checkRuntime()
  },

  checkRuntime: async () => {
    set({
      status: 'checking',
      message: 'Starting runtime check',
      logs: []
    })

    await runTrackedOperation(set, () => window.runtime.check(), {
      ready: 'Runtime ready',
      failed: 'One or more packages failed to install'
    })
  },

  updatePackages: async () => {
    const packagesToUpdate = get().packages.filter((pkg) => pkg.updateAvailable)

    if (packagesToUpdate.length === 0) {
      return
    }

    set({
      status: 'installing',
      message: `Updating ${packagesToUpdate.length} package(s)`,
      progress: 0,
      logs: []
    })

    await runTrackedOperation(
      set,
      () => window.runtime.update(packagesToUpdate.map((pkg) => pkg.name)),
      {
        ready: 'Packages updated',
        failed: 'One or more packages failed to update'
      }
    )
  },

  clearLogs: () => set({ logs: [] }),
  loadAppVersion: async () => {
    const version = await window.app.version()

    set({
      appVersion: version
    })
  }
}))
