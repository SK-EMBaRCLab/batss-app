import { type ReactElement, useEffect, useRef } from 'react'

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine
} from '@/components/ui/code-block'
import { cn } from '@/lib/utils'

type LogViewerProps = {
  logs: string[]
  className?: string
  header?: ReactElement
  failed?: boolean
}

export function LogViewer({
  logs,
  className,
  header,
  failed = false
}: LogViewerProps): ReactElement {
  const contentRef = useRef<HTMLPreElement>(null)
  // Follow new output only while the user is at (or near) the bottom, so
  // scrolling up to read something isn't undone by the next line
  const followRef = useRef(true)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const onScroll = (): void => {
      const distanceFromBottom = content.scrollHeight - content.scrollTop - content.clientHeight
      followRef.current = distanceFromBottom < 24
    }

    content.addEventListener('scroll', onScroll, { passive: true })
    return () => content.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const content = contentRef.current
    if (content && followRef.current) {
      content.scrollTop = content.scrollHeight
    }
  }, [logs])

  return (
    <CodeBlock
      size="sm"
      variant={failed ? 'destructive' : 'default'}
      className={cn('h-full', className)}
    >
      {logs.length > 0 && (
        <CodeBlockActions>
          <CodeBlockCopyButton value={logs.join('\n')} />
        </CodeBlockActions>
      )}

      <CodeBlockContent ref={contentRef} wrap className="flex-1">
        {header}

        {logs.map((line, i) => (
          <CodeBlockLine key={i}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}
