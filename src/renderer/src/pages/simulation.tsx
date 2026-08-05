import { type ReactElement, useEffect, useState } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

import type { SimulationRunInput } from '@shared/simulation-types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/utils'
import { SimulationForm } from '@/components/simulation/form'
import { LogPanel } from '@/components/simulation/log-panel'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export default function Simulation(): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const design = useDesign((s) => s.design)
  const isRunning = useDesign((s) => s.isRunning)
  const runSimulation = useDesign((s) => s.runSimulation)
  const [logs, setLogs] = useState<string[]>([])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const unsubscribe = window.simulation.onLog((line) => {
      setLogs((prev) => [...prev, line])
    })

    return unsubscribe
  }, [])

  const handleRun = async (input: SimulationRunInput): Promise<void> => {
    setLogs([])
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
      const response = await runSimulation(input)

      if (response.status === 'success') {
        navigate('results')
      }
    } finally {
      const elapsed = (performance.now() - start) / 1000

      clearInterval(timer)
      setElapsedSeconds(elapsed)

      setLogs((prev) => [...prev, '', `> Completed in ${formatDuration(elapsed)}`])
    }
  }

  return (
    <div className="relative h-full min-h-0">
      <ResizablePanelGroup orientation="vertical" className="h-full">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6">
            <Card className="min-h-0 flex-1 overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle>
                  {design?.name ?? 'BATSS Simulation Design'}
                  {design && design.results.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      · {design.results.length} run{design.results.length === 1 ? '' : 's'} so far
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-hidden">
                <SimulationForm onRun={handleRun} initialInput={design?.input} />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  form="simulation-form"
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play
                    className={`mr-2 h-5 w-5 transition-transform ${
                      isRunning ? 'animate-pulse scale-110' : ''
                    }`}
                  />
                  {isRunning ? `Running… ${elapsedSeconds.toFixed(1)} s` : `Run Simulation`}
                </Button>
              </CardFooter>
            </Card>
          </div>
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
