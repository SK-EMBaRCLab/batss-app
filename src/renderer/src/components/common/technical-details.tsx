import { ChevronDown } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import { LogViewer } from './log-viewer'

/**
 * "Technical details" disclosure holding the raw R output, for screens
 * that lead with a plain-language status instead. Opens by itself when
 * `failed` becomes true, since that output is what a support contact
 * will need.
 */
export function TechnicalDetails({
  logs,
  failed,
  header,
  centered = false
}: {
  logs: string[]
  failed: boolean
  // Shown above the log lines, e.g. "Waiting for output…"
  header?: ReactElement
  centered?: boolean
}): ReactElement {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (failed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true)
    }
  }, [failed])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn('flex text-muted-foreground', centered && 'mx-auto')}
          >
            <ChevronDown
              className={cn('mr-1 h-4 w-4 transition-transform', open && 'rotate-180')}
            />
            Technical details
          </Button>
        }
      />

      <CollapsibleContent>
        <LogViewer logs={logs} className="mt-2 h-48" header={header} />
      </CollapsibleContent>
    </Collapsible>
  )
}
