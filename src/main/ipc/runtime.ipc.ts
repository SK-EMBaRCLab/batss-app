import { ipcMain, type IpcMainInvokeEvent } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { bootstrapRuntime, updateRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'
import { safeSend } from './safe-send'

type RuntimeTask = { kind: 'check' | 'update'; promise: Promise<RuntimeResult> }

// Checks and updates both drive R's package installer, so they never run
// at the same time. Overlapping checks share one run; an update waits for
// whatever is running and then runs itself (it used to be handed the
// running check's result instead, so the update silently never happened).
let current: RuntimeTask | null = null

function runExclusive(
  kind: RuntimeTask['kind'],
  start: () => Promise<RuntimeResult>
): Promise<RuntimeResult> {
  if (kind === 'check' && current?.kind === 'check') return current.promise

  const previous = current?.promise ?? Promise.resolve()
  const promise = previous.catch(() => undefined).then(start)
  const task: RuntimeTask = { kind, promise }
  current = task

  const clear = (): void => {
    if (current === task) current = null
  }
  promise.then(clear, clear)

  return promise
}

// Progress and log lines go back to the window that asked
function reporterFor(event: IpcMainInvokeEvent): RuntimeReporter {
  const send = safeSend(event.sender)
  return new RuntimeReporter(
    (update: RuntimeUpdate) => send(IPC.runtime.update, update),
    (line: string) => send(IPC.runtime.log, line)
  )
}

export function registerRuntimeIPC(): void {
  ipcMain.handle(IPC.runtime.check, (event) =>
    runExclusive('check', () => bootstrapRuntime(reporterFor(event)))
  )

  ipcMain.handle(IPC.runtime.update, (event, data: unknown) => {
    // Names are also filtered against the required package list in
    // updateRuntime; this just makes sure they're strings
    const packages = Array.isArray(data)
      ? data.filter((name): name is string => typeof name === 'string')
      : []

    return runExclusive('update', () => updateRuntime(packages, reporterFor(event)))
  })
}
