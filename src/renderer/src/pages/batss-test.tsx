import { JSX, useEffect, useState } from 'react'
import { usePanelRef } from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

import type { BatssRunInput, BatssRunResult } from '@shared/batss-types'
import { Results } from '@/components/results'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/utils'
import { BatssForm } from '@/components/batss/batts-form'
import { LogPanel } from '@/components/batss/log-panel'

export default function BatssTest(): JSX.Element {
  const [resultsVisible, setResultsVisible] = useState(false)
  const ref = usePanelRef()

  const [result, setResult] = useState<BatssRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    ref.current?.collapse()
  }, [ref])

  useEffect(() => {
    const unsubscribe = window.batss.onLog((line) => {
      setLogs((prev) => [...prev, line])
    })

    return unsubscribe
  }, [])

  const hideResults = (): void => {
    setResultsVisible(false)
    ref.current?.collapse()
  }

  const showResults = (): void => {
    setResultsVisible(true)

    setTimeout(() => {
      ref.current?.expand()
      ref.current?.resize('50%')
    }, 0)
  }

  const runSimulation = async (input: BatssRunInput): Promise<void> => {
    setIsRunning(true)
    setLogs([])
    setResult(null)
    setElapsedSeconds(0)

    setLogs([
      '> Starting BATSS simulation',
      `> Parameters: N=${input.N}, R=${input.R}, m0=${input.m0}, m=${input.m}`,
      `> Probability=${input.probability}, logOdds=${input.logOdds}`,
      `> Decision rule: b=${input.b}, deltaEff=${input.deltaEff}`,
      ''
    ])

    const start = performance.now()

    const timer = window.setInterval(() => {
      setElapsedSeconds((performance.now() - start) / 1000)
    }, 100)

    try {
      const response = await window.batss.runExample(input)

      setResult(response)

      if (response.status === 'success') {
        showResults()
      }
    } finally {
      const elapsed = (performance.now() - start) / 1000

      clearInterval(timer)
      setElapsedSeconds(elapsed)
      setIsRunning(false)

      setLogs((prev) => [...prev, '', `> Completed in ${formatDuration(elapsed)}`])
    }
  }

  return (
    <div className="relative h-full min-h-0">
      {!resultsVisible && result && (
        <Button className="absolute right-4 top-4 z-10" onClick={showResults}>
          Show Results
        </Button>
      )}
      <ResizablePanelGroup orientation="vertical" className="h-full">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize="50%" minSize="20%">
              <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6">
                <Card className="max-w-2xl min-h-0 flex-1 overflow-hidden flex flex-col">
                  <CardHeader>
                    <CardTitle>BATSS Simulation Design</CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 overflow-auto">
                    <BatssForm
                      onRun={runSimulation}
                      isRunning={isRunning}
                      elapsedSeconds={elapsedSeconds}
                    />
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize="50%"
              minSize="20%"
              collapsible
              collapsedSize="0%"
              panelRef={ref}
            >
              <div className="h-full overflow-auto p-6">
                {result ? (
                  <Results result={result} onClose={hideResults} />
                ) : (
                  <div className="text-muted-foreground">Run simulation to see results</div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize="10%" defaultSize="20%">
          <div className="flex h-full min-h-0 flex-col gap-4 p-4">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">Simulation Log</h2>
            </div>
            <div className="min-h-0 flex-1">
              <LogPanel logs={logs} isRunning={isRunning} elapsedSeconds={elapsedSeconds} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
