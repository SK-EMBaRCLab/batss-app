import { type IpcMainInvokeEvent } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { bootstrapRuntime, updateRuntime } from '../runtime/bootstrap'
import { RuntimeReporter } from '../runtime/reporter'
import type { RuntimeResult, RuntimeUpdate } from '../runtime/types'
import { batchedLogSender, safeSend } from './safe-send'
import { handle } from './trusted-ipc'

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
