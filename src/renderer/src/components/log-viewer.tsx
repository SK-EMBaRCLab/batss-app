import { ReactElement, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import { ScrollArea } from './ui/scroll-area'

type LogViewerProps = {
  logs: string[]
  className?: string
  header?: ReactElement
}

export function LogViewer({ logs, className, header }: LogViewerProps): ReactElement {
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
    <ScrollArea
      ref={logScrollRef}
      className={cn('h-full rounded-md border border-border bg-black p-3', className)}
    >
      <div className="font-mono text-xs text-green-400">
        {header}

        {logs.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
