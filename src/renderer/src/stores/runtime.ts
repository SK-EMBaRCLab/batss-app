import { create } from 'zustand'

import { createErrorReference, logError, withReference } from '@/lib/error-reference'
import { appendLogs, subscribeLogs } from '@/lib/log-buffer'
import { toError } from '@/lib/utils'

import type { RuntimePackage, RuntimeStatus, RuntimeUpdate } from '../../../shared/runtime-types'

type RuntimeState = {
  status: RuntimeStatus
  message: string
  progress: number
  packages: RuntimePackage[]
  logs: string[]
  error?: string
  initialized: boolean
  appVersion: string
  bootstrapped: boolean
  loadAppVersion: () => Promise<void>

  initialize: () => Promise<void>
  checkRuntime: () => Promise<void>
  updatePackages: () => Promise<void>
}

// Runs a tracked runtime operation (initial check or package update):
// subscribes to the live update/log channels, runs `operation`, maps
// the resulting RuntimeResult into store state, and always cleans up
// the subscriptions - regardless of success, R-level failure, or a
// rejected IPC call. checkRuntime and updatePackages only describe what
// makes them different (the operation itself and the ready/failure
// messages).
async function runTrackedOperation(
  set: (partial: Partial<RuntimeState> | ((state: RuntimeState) => Partial<RuntimeState>)) => void,
  get: () => RuntimeState,
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

  const teardownLog = subscribeLogs(window.runtime.onLog, (lines) =>
    set((state) => ({ logs: appendLogs(state.logs, lines) }))
  )

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
    // For failures main caught, it has already reported a user-facing
    // message (see bootstrap.ts), so keep that rather than the rejection's
    // raw text. Anything else (the IPC call itself failing) gets a generic
    // message and a reference.
    if (get().status === 'error') {
      set({ error: undefined })
    } else {
      const reference = createErrorReference()
      logError(reference, toError(error), 'runtime')
      set({ status: 'error', message: withReference(messages.failed, reference), error: undefined })
    }
  } finally {
    unsubscribeUpdate()
    teardownLog()
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
  bootstrapped: false,

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
    try {
      await runTrackedOperation(set, get, () => window.runtime.check(), {
        ready: 'Runtime ready',
        failed: 'One or more packages failed to install'
      })
    } finally {
      set({ bootstrapped: true })
    }
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
      get,
      () => window.runtime.update(packagesToUpdate.map((pkg) => pkg.name)),
      {
        ready: 'Packages updated',
        failed: 'One or more packages failed to update'
      }
    )
  },

  loadAppVersion: async () => {
    const version = await window.app.version()

    set({
      appVersion: version
    })
  }
}))
