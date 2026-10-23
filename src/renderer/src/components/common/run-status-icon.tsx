import { type ReactElement } from 'react'

import { RUN_STATUS, type RunStatus } from '@/lib/run-status'
import { cn } from '@/lib/utils'

export function RunStatusIcon({
  status,
  className
}: {
  status: RunStatus
  className?: string
}): ReactElement {
  const { icon: Icon, className: colour } = RUN_STATUS[status]
  return <Icon aria-hidden className={cn('size-4 shrink-0', colour, className)} />
}
