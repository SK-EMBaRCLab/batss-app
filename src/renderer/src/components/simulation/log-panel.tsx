import { type ReactElement, useEffect, useState } from 'react'

import { LogViewer } from '@/components/common/log-viewer'
import { formatDuration } from '@/lib/utils'

type LogPanelProps = {
  logs: string[]
  isRunning: boolean
  startedAt: number | null
  endedAt: number | null
}

function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || endedAt !== null) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt, endedAt])

  if (startedAt === null) return 0
  return ((endedAt ?? now) - startedAt) / 1000
}

export function LogPanel({ logs, isRunning, startedAt, endedAt }: LogPanelProps): ReactElement {
  const elapsed = useElapsedSeconds(startedAt, endedAt)

  return (
    <LogViewer
      logs={logs}
      header={
        isRunning ? (
          <>
            <div>{'> Running BATSS simulation...'}</div>
            <div>{`> Elapsed: ${formatDuration(elapsed)}`}</div>
            <div />
          </>
        ) : undefined
      }
    />
  )
}
