import type { EngineBusy } from '@shared/engine-types'
import { describeBusy } from '@shared/engine-types'
import type { DesignInput, SimulationResultEntry } from '@shared/simulation-types'

import { createErrorReference, logError, withReference } from '@/lib/error-reference'
import { toError } from '@/lib/utils'

import { useDesign } from './design'
import { useEngine } from './engine'

// The start and end every R run shares, single simulation or batch:
// claim the engine (or report what's using it), remember which design
// the run belongs to, and always release the engine afterwards. Each
// store keeps only what's particular to it (its progress, logs, toasts).

export type RunSession = {
  /** The design store's openCount when the run started: which opening of a design it belongs to. */
  openCount: number
  /** This computer's core count for the duration estimate; null if unavailable. */
  cpuCount: () => Promise<number | null>
  /**
   * Files a result under the design that was open when the run started,
   * first saving `input` as the design's input if given. Skipped if a
   * design was opened, created or closed since (the run was stopped to
   * allow that), even the same file again, so it isn't filed under the
   * wrong one. Returns whether it was filed.
   */
  saveResult: (entry: Omit<SimulationResultEntry, 'id'>, input?: DesignInput) => boolean
}

/**
 * Runs `run` while holding the engine. If something else holds it,
 * returns `onBusy` with a message saying what, without running.
 */
export async function runWithEngine<T>(
  kind: Exclude<EngineBusy, 'idle'>,
  onBusy: (message: string) => T,
  run: (session: RunSession) => Promise<T>
): Promise<T> {
  if (!useEngine.getState().tryAcquire(kind)) return onBusy(describeBusy(useEngine.getState()))

  const { openCount } = useDesign.getState()

  const session: RunSession = {
    openCount,
    cpuCount: () => window.app.cpuCount().catch(() => null),
    saveResult: (entry, input) => {
      const design = useDesign.getState()
      if (!design.design || design.openCount !== openCount) return false
      if (input) design.updateInput(input)
      design.appendResult(entry)
      return true
    }
  }

  try {
    return await run(session)
  } finally {
    useEngine.getState().release()
  }
}

/**
 * For a run request that failed outright (the request, not R): records
 * the details in the error log and returns `message` with the reference
 * appended, to show users and to save with the design.
 */
export function requestFailed(
  error: unknown,
  context: string,
  message: string
): { reference: string; message: string } {
  const reference = createErrorReference()
  logError(reference, toError(error), context)
  return { reference, message: withReference(message, reference) }
}
