import { ipcMain } from 'electron'

import { bootstrapRuntime, updateRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'

let inFlight: Promise<RuntimeResult> | null = null

export function registerRuntimeIPC(): void {
  ipcMain.removeHandler('runtime:check')
  ipcMain.removeHandler('runtime:update')

  ipcMain.handle('runtime:check', async (event) => {
    const send = (update: RuntimeUpdate): void => {
      event.sender.send('runtime:update', update)
    }

    const sendLog = (line: string): void => {
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

  ipcMain.handle('runtime:update', async (event, packages: string[]) => {
    const send = (update: RuntimeUpdate): void => {
      event.sender.send('runtime:update', update)
    }

    const sendLog = (line: string): void => {
      event.sender.send('runtime:log', line)
    }

    if (inFlight) {
      return inFlight
    }

    const reporter = new RuntimeReporter(send, sendLog)

    inFlight = updateRuntime(packages, reporter).finally(() => {
      inFlight = null
    })

    return inFlight
  })
}
