// src/main/ipc/runtime.ipc.ts

import { ipcMain } from 'electron'

import { bootstrapRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'

let inFlight: Promise<RuntimeResult> | null = null

export function registerRuntimeIPC() {
  ipcMain.removeHandler('runtime:check')

  ipcMain.handle('runtime:check', async (event) => {
    const send = (update: RuntimeUpdate) => {
      event.sender.send('runtime:update', update)
    }

    const sendLog = (line: string) => {
      event.sender.send('runtime:log', line)
    }

    if (inFlight) {
      return inFlight
    }

    const reporter = new RuntimeReporter(send, sendLog)

    inFlight = bootstrapRuntime(reporter).finally(() => {
      inFlight = null
    })

    return inFlight
  })
}
