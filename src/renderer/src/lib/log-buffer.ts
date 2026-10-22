export const MAX_LOG_LINES = 2000

/** Append `lines`, keeping only the most recent `max`. */
export function appendLogs(logs: string[], lines: string[], max = MAX_LOG_LINES): string[] {
  const next = [...logs, ...lines]
  return next.length > max ? next.slice(next.length - max) : next
}

export type LogBatcher = {
  push: (line: string) => void
  flush: () => void
}

/**
 * Coalesces a stream of single lines into batched flushes. A chatty R
 * process (thousands of compiler or INLA lines) then costs a handful of
 * renders per second instead of one per line.
 */
export function createLogBatcher(onFlush: (lines: string[]) => void, waitMs = 50): LogBatcher {
  let pending: string[] = []
  let timer: number | null = null

  const flush = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    if (pending.length === 0) return
    const lines = pending
    pending = []
    onFlush(lines)
  }

  return {
    push: (line) => {
      pending.push(line)
      if (timer === null) timer = window.setTimeout(flush, waitMs)
    },
    flush
  }
}

/**
 * Wires a batched log listener to an IPC onLog subscription and
 * returns a single teardown function (unsubscribe + final flush).
 * Used by every store that streams R output (runtime, simulation,
 * batch) so the subscribe/unsubscribe/flush dance lives in one place.
 * `.flush()` applies any lines still waiting in the batch, for callers
 * that must see them before handling another event (e.g. a batch row
 * finishing, so its late lines can't land after the row is reset).
 */
export function subscribeLogs(
  onLog: (callback: (line: string) => void) => () => void,
  appendTo: (lines: string[]) => void
): (() => void) & { flush: () => void } {
  const batcher = createLogBatcher(appendTo)
  const unsubscribe = onLog(batcher.push)

  const teardown = (): void => {
    unsubscribe()
    batcher.flush()
  }

  return Object.assign(teardown, { flush: batcher.flush })
}
