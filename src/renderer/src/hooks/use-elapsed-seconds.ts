import { useEffect, useState } from 'react'

/**
 * Seconds from `startedAt` to `endedAt`, or to now (ticking) while
 * `endedAt` is null. 0 before anything has started.
 */
export function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || endedAt !== null) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [startedAt, endedAt])

  if (startedAt === null) return 0
  return Math.max(0, ((endedAt ?? now) - startedAt) / 1000)
}
