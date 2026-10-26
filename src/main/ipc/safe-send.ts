export function safeSend(sender: Electron.WebContents) {
  return (channel: string, payload?: unknown): void => {
    if (!sender.isDestroyed()) sender.send(channel, payload)
  }
}

/**
 * Sends R's log lines on `channel` in batches (string[]) rather than one
 * message per line, so a chatty run can't flood the window. Call flush()
 * when the operation ends, so its last lines arrive before its result.
 */
export function batchedLogSender(
  send: (channel: string, payload?: unknown) => void,
  channel: string,
  intervalMs = 100
): { push: (line: string) => void; flush: () => void } {
  let pending: string[] = []
  let timer: NodeJS.Timeout | null = null

  const flush = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (pending.length === 0) return
    send(channel, pending)
    pending = []
  }

  return {
    push: (line) => {
      pending.push(line)
      if (!timer) timer = setTimeout(flush, intervalMs)
    },
    flush
  }
}
