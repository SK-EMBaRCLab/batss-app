// src/renderer/src/pages/runtime-screen.tsx

import { JSX, useEffect, useRef } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Progress } from '@/components/ui/progress'

import { ScrollArea } from '@/components/ui/scroll-area'

import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'

import { useRuntime } from '@/stores/runtime'

export function RuntimeScreen(): JSX.Element {
  const status = useRuntime((state) => state.status)

  const message = useRuntime((state) => state.message)

  const progress = useRuntime((state) => state.progress)

  const logs = useRuntime((state) => state.logs)

  // Ref goes on a plain wrapping div, not on ScrollArea directly, so
  // ref-forwarding quirks in the generated component can't break this.
  // The actual scrollable element is the Viewport nested inside — this
  // project's scroll-area.tsx wraps Base UI (@base-ui/react/scroll-area),
  // NOT Radix, so it's tagged data-slot="scroll-area-viewport", not
  // Radix's data-radix-scroll-area-viewport.
  const scrollRootRef = useRef<HTMLDivElement>(null)

  const isChecking = status === 'checking'

  const isInstalling = status === 'installing'

  const isReady = status === 'ready'

  const isError = status === 'error'

  // Auto-scroll to the newest log line as output streams in.
  useEffect(() => {
    const viewport = scrollRootRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    )

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [logs])

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

          {logs.length > 0 && (isChecking || isInstalling || isError) && (
            <div ref={scrollRootRef}>
              <ScrollArea className="h-48 rounded-md border border-border bg-black p-3">
                <div className="font-mono text-xs text-green-400">
                  {logs.map((line, i) => (
                    // Index is stable here since lines only ever get
                    // appended/trimmed from the front, never reordered.
                    <div key={i} className="whitespace-pre-wrap break-all">
                      {line}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
