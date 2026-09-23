import { ipcMain } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { bootstrapRuntime, updateRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'
import { safeSend } from './safe-send'

let inFlight: Promise<RuntimeResult> | null = null

export function registerRuntimeIPC(): void {
  ipcMain.handle(IPC.runtime.check, async (event) => {
    const send = safeSend(event.sender)
    const sendUpdate = (update: RuntimeUpdate): void => send(IPC.runtime.update, update)

    const sendLog = (line: string): void => send(IPC.runtime.log, line)

    if (inFlight) {
      return inFlight
    }

    const reporter = new RuntimeReporter(sendUpdate, sendLog)

    inFlight = bootstrapRuntime(reporter).finally(() => {
      inFlight = null
    })

    return inFlight
  })

  ipcMain.handle(IPC.runtime.update, async (event, packages: string[]) => {
    const send = safeSend(event.sender)
    const sendUpdate = (update: RuntimeUpdate): void => send(IPC.runtime.update, update)
    const sendLog = (line: string): void => send(IPC.runtime.log, line)

    if (inFlight) {
      return inFlight
    }

    const reporter = new RuntimeReporter(sendUpdate, sendLog)

    inFlight = updateRuntime(packages, reporter).finally(() => {
      inFlight = null
    })

    return inFlight
  })
}
