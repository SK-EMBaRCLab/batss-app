const MAX_LOG_LINES = 2000

/** Append `lines`, keeping only the most recent `max`. */
export function appendLogs(logs: string[], lines: string[], max = MAX_LOG_LINES): string[] {
  const next = [...logs, ...lines]
  return next.length > max ? next.slice(next.length - max) : next
}

/**
 * Appends each batch of log lines main sends (it batches them, so a
 * chatty R process costs a few renders a second, not one per line).
 * Returns the function that stops listening. Lines arrive in order with
 * a run's other events: main sends a row's last lines before it sends
 * the row finishing.
 */
export function subscribeLogs(
  onLog: (callback: (lines: string[]) => void) => () => void,
  appendTo: (lines: string[]) => void
): () => void {
  return onLog(appendTo)
}
