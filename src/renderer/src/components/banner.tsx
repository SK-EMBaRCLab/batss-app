import { AlertTriangle, CheckCircle2, Info, Loader2, Siren, X } from 'lucide-react'
import { type ReactElement } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BannerVariant = 'info' | 'success' | 'warning' | 'error' | 'loading'

interface BannerProps {
  title: string
  description?: string
  variant?: BannerVariant
  action?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const variants = {
  info: {
    icon: Info,
    className:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
  },
  success: {
    icon: CheckCircle2,
    className:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
  },
  warning: {
    icon: AlertTriangle,
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200'
  },
  error: {
    icon: Siren,
    className:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
  },
  loading: {
    icon: Loader2,
    className:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
  }
}

export function Banner({
  title,
  description,
  variant = 'info',
  action,
  dismissible,
  onDismiss,
  className
}: BannerProps): ReactElement {
  const Icon = variants[variant].icon

  return (
    <Alert
      className={cn('rounded-none border-x-0 border-t-0', variants[variant].className, className)}
    >
      <Icon className={cn('h-4 w-4', variant === 'loading' && 'animate-spin')} />

      <div className="flex flex-1 items-start justify-between gap-4">
        <div>
          <AlertTitle>{title}</AlertTitle>

          {description && <AlertDescription>{description}</AlertDescription>}
        </div>

        <div className="flex items-center gap-2">
          {action}

          {dismissible && (
            <Button size="icon" variant="ghost" onClick={onDismiss} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}
