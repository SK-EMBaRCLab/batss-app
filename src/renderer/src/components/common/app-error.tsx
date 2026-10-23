import { AlertTriangle, Copy, RefreshCw } from 'lucide-react'
import { type ReactElement, useEffect, useMemo, useState } from 'react'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createErrorReference, errorDetails, logError } from '@/lib/error-reference'
import { toError } from '@/lib/utils'

export function AppError({ error, resetErrorBoundary }: FallbackProps): ReactElement {
  // Memoised so the log effect below runs once per error, not per render
  const err = useMemo(() => toError(error), [error])
  const [reference] = useState(createErrorReference)

  useEffect(() => logError(reference, err), [reference, err])

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(errorDetails(reference, err))
  }

  return (
    <main className="flex h-screen items-center justify-center bg-muted/30 p-8">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertTriangle className="size-7 text-destructive" />
            </div>

            <div className="space-y-1">
              <CardTitle>Albatross encountered an unexpected error</CardTitle>

              <CardDescription>
                The application could not recover from an unexpected problem. You can try reloading
                the application. If the problem continues, copy the details and include them in a
                bug report.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-muted-foreground">
            Reference: <span className="font-mono font-medium text-foreground">{reference}</span>
          </p>

          <div className="flex gap-2">
            <Button onClick={() => window.app.reload()}>
              <RefreshCw className="mr-2 size-4" />
              Reload Application
            </Button>

            <Button variant="outline" onClick={copy}>
              <Copy className="mr-2 size-4" />
              Copy details
            </Button>

            <Button variant="ghost" onClick={resetErrorBoundary}>
              Retry Render
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
