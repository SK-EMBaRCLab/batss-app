import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { formatDuration } from '@/lib/utils'
import { useRuntime } from '@/stores/runtime'

import { LogViewer } from './log-viewer'

function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeconds(0)
      return
    }

    const startedAt = Date.now()
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(id)
  }, [active])

  return seconds
}

export function RuntimeScreen(): ReactElement {
  const status = useRuntime((state) => state.status)
  const message = useRuntime((state) => state.message)
  const progress = useRuntime((state) => state.progress)
  const logs = useRuntime((state) => state.logs)
  const error = useRuntime((state) => state.error)
  const checkRuntime = useRuntime((state) => state.checkRuntime)

  const isChecking = status === 'checking'
  const isInstalling = status === 'installing'
  const isReady = status === 'ready'
  const isError = status === 'error'
  const isWorking = isChecking || isInstalling

  const elapsed = useElapsedSeconds(isChecking || isInstalling)

  const [detailsOpen, setDetailsOpen] = useState(false)

  // Jump the technical log open automatically on failure — that's
  // exactly what a support contact will need to see.
  useEffect(() => {
    if (isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailsOpen(true)
    }
  }, [isError])

  const copyDetails = async (): Promise<void> => {
    const details = [
      `Status: ${status}`,
      `Message: ${message}`,
      error ? `Error: ${error}` : null,
      '',
      'Log:',
      ...logs
    ]
      .filter((line): line is string => line !== null)
      .join('\n')

    await navigator.clipboard.writeText(details)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Albatross</CardTitle>

          <CardDescription>
            {isError
              ? "We couldn't finish setting up"
              : isReady
                ? "You're all set"
                : 'Setting up Albatross'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {isWorking && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
            {isReady && <CheckCircle2 className="h-10 w-10 text-green-500" />}
            {isError && <CircleAlert className="h-10 w-10 text-destructive" />}
          </div>

          {isWorking && (
            <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
              Albatross uses R, a free statistics program, along with a couple of add-on packages it
              needs to run simulations. The first time you open Albatross, it checks for these and
              installs anything missing — this only happens once.
            </p>
          )}

          <div className="space-y-2">
            {isWorking && (
              <div className="text-center text-sm text-muted-foreground">{message}</div>
            )}

            {isWorking && (
              <div className="text-center text-xs text-muted-foreground">
                {formatDuration(elapsed)} elapsed
                {elapsed > 60 &&
                  ' — this can take a few minutes the first time, depending on your internet connection.'}
              </div>
            )}

            {isWorking && <Progress value={progress} />}
          </div>

          {isError && (
            <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">
                Albatross couldn&apos;t find or set up R, the statistics program it needs to run
                simulations.
              </p>
              <p className="text-muted-foreground">
                If R isn&apos;t installed on this computer, you — or your IT team or course
                instructor — can install it for free, then come back and try again.
              </p>
            </div>
          )}

          {isError && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => checkRuntime()}>
                <RefreshCw className="mr-2 size-4" />
                Try again
              </Button>

              <Button
                variant="outline"
                render={<a href="https://www.r-project.org/" target="_blank" rel="noreferrer" />}
              >
                <ExternalLink className="mr-2 size-4" />
                Download R
              </Button>

              <Button variant="ghost" onClick={copyDetails}>
                <Copy className="mr-2 size-4" />
                Copy details for support
              </Button>
            </div>
          )}
          {(isWorking || isError) && (
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger
                render={
                  <Button variant="ghost" size="sm" className="mx-auto flex text-muted-foreground">
                    <ChevronDown
                      className={`mr-1 h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                    />
                    Technical details
                  </Button>
                }
              />

              <CollapsibleContent>
                <LogViewer
                  logs={logs}
                  className="mt-3 h-48"
                  header={
                    logs.length === 0 ? (
                      <div className="text-muted-foreground">Waiting for output…</div>
                    ) : undefined
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
