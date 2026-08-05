import { type ReactElement } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'

export function AppError({ error, resetErrorBoundary }: FallbackProps): ReactElement {
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(
      `${error.name}

      ${error.message}

      ${error.stack ?? ''}`
    )
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
                the application. If the problem continues, copy the error details and include them
                in a bug report.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="font-medium">{error.name}</p>

            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => window.app.reload()}>
              <RefreshCw className="mr-2 size-4" />
              Reload Application
            </Button>

            <Button variant="outline" onClick={copy}>
              <Copy className="mr-2 size-4" />
              Copy Error
            </Button>

            <Button variant="ghost" onClick={resetErrorBoundary}>
              Retry Render
            </Button>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="text-sm font-medium hover:underline">
              Technical Details
            </CollapsibleTrigger>

            <CollapsibleContent>
              <pre className="mt-3 max-h-72 overflow-auto rounded-md border bg-muted p-4 font-mono text-xs">
                {error.stack}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </main>
  )
}
