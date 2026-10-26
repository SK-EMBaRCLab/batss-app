import { type IpcMainInvokeEvent } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { bootstrapRuntime, updateRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'
import { runExclusive } from './runtime-queue'
import { batchedLogSender, safeSend } from './safe-send'
import { handle } from './trusted-ipc'

// Progress and log lines go back to the window that asked. Log lines are
// batched; the batch is flushed when the operation ends.
function withReporter(
  event: IpcMainInvokeEvent,
  run: (reporter: RuntimeReporter) => Promise<RuntimeResult>
): Promise<RuntimeResult> {
  const send = safeSend(event.sender)
  const log = batchedLogSender(send, IPC.runtime.log)
  const reporter = new RuntimeReporter(
    (update: RuntimeUpdate) => send(IPC.runtime.update, update),
    log.push
  )
  return run(reporter).finally(log.flush)
}

export function registerRuntimeIPC(): void {
  handle(IPC.runtime.check, (event) =>
    runExclusive('check', () => withReporter(event, bootstrapRuntime))
  )

  handle(IPC.runtime.update, (event, data: unknown) => {
    // Names are also filtered against the required package list in
    // updateRuntime; this just makes sure they're strings
    const packages = Array.isArray(data)
      ? data.filter((name): name is string => typeof name === 'string')
      : []

    return runExclusive('update', () =>
      withReporter(event, (reporter) => updateRuntime(packages, reporter))
    )
  })
}
