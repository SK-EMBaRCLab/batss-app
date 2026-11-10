// Why an R process was stopped before it finished. Callers tell a cancel
// from a timeout by class, not by matching message text, so either
// message can be reworded without turning cancellations into "stopped
// unexpectedly" errors.

/** R was stopped on purpose: cancelled, or out of time. Its message is shown as is. */
export class RAbortedError extends Error {
  constructor(message: string) {
    super(message)
    // Kept for anything that checks the standard name for an abort
    this.name = 'AbortError'
  }
}

/** Stopped by the user, or by the app (e.g. a batch being cancelled). */
export class RCancelledError extends RAbortedError {}

/** Stopped because it ran past its time limit. */
export class RTimeoutError extends RAbortedError {
  constructor(timeoutMs: number) {
    super(`R process timed out after ${Math.round(timeoutMs / 1000)}s`)
  }
}

/**
 * The error for an aborted run, from the reason its AbortSignal was
 * aborted with. Either class passes through unchanged; anything else,
 * which shouldn't happen, counts as a cancel.
 */
export function abortErrorFrom(reason: unknown): RAbortedError {
  if (reason instanceof RAbortedError) return reason
  return new RCancelledError('R process was cancelled')
}
