import { type ReactElement, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import { ScrollArea } from '../ui/scroll-area'

type LogViewerProps = {
  logs: string[]
  className?: string
  header?: ReactElement
}

export function LogViewer({ logs, className, header }: LogViewerProps): ReactElement {
  const logScrollRef = useRef<HTMLDivElement>(null)
  // Follow new output only while the user is at (or near) the bottom, so
  // scrolling up to read something isn't undone by the next line
  const followRef = useRef(true)

  const getViewport = (): HTMLDivElement | null | undefined =>
    logScrollRef.current?.querySelector<HTMLDivElement>('[data-slot="scroll-area-viewport"]')

  useEffect(() => {
    const viewport = getViewport()
    if (!viewport) return

    const onScroll = (): void => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      followRef.current = distanceFromBottom < 24
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const viewport = getViewport()
    if (viewport && followRef.current) {
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
