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
