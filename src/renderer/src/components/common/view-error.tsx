import { AlertTriangle, Copy, RefreshCw } from 'lucide-react'
import { type ReactElement, useEffect, useMemo, useState } from 'react'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createErrorReference, errorDetails, logError } from '@/lib/error-reference'
import { toError } from '@/lib/utils'

export function ViewError({ error, resetErrorBoundary }: FallbackProps): ReactElement {
  // Memoised so the log effect below runs once per error, not per render
  const err = useMemo(() => toError(error), [error])
  const [reference] = useState(createErrorReference)

  useEffect(() => logError(reference, err), [reference, err])

  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            This page crashed
          </CardTitle>

          <CardDescription>An unexpected error occurred while rendering this view.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reference: <span className="font-mono font-medium text-foreground">{reference}</span>
          </p>

          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary}>
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(errorDetails(reference, err))}
            >
              <Copy className="mr-2 size-4" />
              Copy details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
