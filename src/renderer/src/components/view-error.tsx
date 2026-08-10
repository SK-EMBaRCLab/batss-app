import { type ReactElement } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toError } from '@/lib/utils'

export function ViewError({ error, resetErrorBoundary }: FallbackProps): ReactElement {
  const err = toError(error)
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
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{err.message}</pre>

          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
