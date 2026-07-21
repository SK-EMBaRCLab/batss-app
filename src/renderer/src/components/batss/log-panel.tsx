import { JSX, useEffect, useRef } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDuration } from '@/lib/utils'

type LogPanelProps = {
  logs: string[]
  isRunning: boolean
  elapsedSeconds: number
}

export function LogPanel({ logs, isRunning, elapsedSeconds }: LogPanelProps): JSX.Element {
  const logScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = logScrollRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    )

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [logs])

  return (
    <ScrollArea ref={logScrollRef} className="h-full rounded-md border border-border bg-black p-3">
      <div className="font-mono text-xs text-green-400">
        {isRunning && (
          <>
            <div>{'> Running BATSS simulation...'}</div>
            <div>{`> Elapsed: ${formatDuration(elapsedSeconds)}`}</div>
            <div />
          </>
        )}

        {logs.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
