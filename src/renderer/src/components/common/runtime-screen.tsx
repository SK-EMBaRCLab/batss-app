import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const isChecking = status === 'checking'

  const isInstalling = status === 'installing'

  const isReady = status === 'ready'

  const isError = status === 'error'

  const elapsed = useElapsedSeconds(isChecking || isInstalling)

  return (
    <div
      className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-background
      p-6
    "
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Albatross</CardTitle>

          <CardDescription>Preparing simulation environment</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className="
            flex
            justify-center
          "
          >
            {(isChecking || isInstalling) && (
              <Loader2
                className="
                  h-10
                  w-10
                  animate-spin
                  text-primary
                "
              />
            )}

            {isReady && (
              <CheckCircle2
                className="
                  h-10
                  w-10
                  text-green-500
                "
              />
            )}

            {isError && (
              <CircleAlert
                className="
                  h-10
                  w-10
                  text-destructive
                "
              />
            )}
          </div>

          <div className="space-y-2">
            <div
              className="
              text-center
              text-sm
              text-muted-foreground
            "
            >
              {message}
            </div>

            {(isChecking || isInstalling) && (
              <div className="text-center text-xs text-muted-foreground">
                {formatDuration(elapsed)} elapsed
                {elapsed > 60 && ' — first-time installs of R packages can take several minutes'}
              </div>
            )}

            {(isChecking || isInstalling) && <Progress value={progress} />}
          </div>

          {isError && (
            <div
              className="
              rounded-md
              border
              border-destructive/50
              bg-destructive/10
              p-3
              text-sm
              text-destructive
            "
            >
              R and BATSS are required to run simulations.
            </div>
          )}

          {(isChecking || isInstalling || isError) && (
            <LogViewer
              logs={logs}
              className="h-48"
              header={
                logs.length === 0 ? (
                  <div className="text-muted-foreground">Waiting for output…</div>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
