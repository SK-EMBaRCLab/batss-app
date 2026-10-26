// Kept free of Electron imports so it can be tested on its own

import type { RuntimeResult } from '../runtime/types'

type RuntimeTask = { kind: 'check' | 'update'; promise: Promise<RuntimeResult> }

// Checks and updates both drive R's package installer, so they never run
// at the same time. Overlapping checks share one run; an update waits for
// whatever is running and then runs itself (it used to be handed the
// running check's result instead, so the update silently never happened).
let current: RuntimeTask | null = null

export function runExclusive(
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
