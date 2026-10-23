import { type ReactElement, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Shared layout for the step help shown beside (or, on narrow windows,
// in a sheet over) the simulation form.

export function HelpPanel({
  children,
  className
}: {
  children: ReactNode
  // Spacing between sections; defaults to space-y-5
  className?: string
}): ReactElement {
  return (
    <div className="px-4 pt-3 pb-4 text-sm text-foreground/80">
      <div className={cn('space-y-5', className)}>{children}</div>
    </div>
  )
}

export function HelpSection({
  title,
  children
}: {
  title: ReactNode
  children: ReactNode
}): ReactElement {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-primary">{title}</h4>
      {children}
    </div>
  )
}
