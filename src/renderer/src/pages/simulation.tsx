import { SimulationRunInput } from '@shared/simulation-types'
import { ChevronDown } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { SimulationForm } from '@/components/simulation/form'
import { LogPanel } from '@/components/simulation/log-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatDuration } from '@/lib/utils'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export default function Simulation(): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const design = useDesign((s) => s.design)
  const isRunning = useDesign((s) => s.isRunning)
  const runSimulation = useDesign((s) => s.runSimulation)
  const [logs, setLogs] = useState<string[]>([])
  const [logsOpen, setLogsOpen] = useState(false)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const unsubscribe = window.simulation.onLog((line) => {
      setLogs((prev) => [...prev, line])
    })

    return unsubscribe
  }, [])

  const handleRun = async (runnableInput: SimulationRunInput, formInput): Promise<void> => {
    setLogsOpen(true)
    setLogs([])
    setElapsedSeconds(0)

    setLogs([
      '> Starting BATSS simulation',
      `> Outcome: ${runnableInput.outcomeType}`,
      `> Sample size: N=${runnableInput.N}, m0=${runnableInput.m0}, m=${runnableInput.m}`,
      `> Simulation runs: ${runnableInput.R}`,
      `> Decision rules: ${runnableInput.decisionRules.length}`,
      ''
    ])

    const start = performance.now()

    const timer = window.setInterval(() => {
      setElapsedSeconds((performance.now() - start) / 1000)
    }, 100)

    try {
      const response = await runSimulation(runnableInput, formInput)

      if (response.status === 'success') {
        navigate('results')
      } else {
        setLogs((prev) => [...prev, '', `> Error: ${response.message}`])
      }
    } finally {
      const elapsed = (performance.now() - start) / 1000

      clearInterval(timer)
      setElapsedSeconds(elapsed)

      setLogs((prev) => [...prev, '', `> Completed in ${formatDuration(elapsed)}`])
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
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
      </Card>
      <Card className="shrink-0">
        <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Simulation Log</CardTitle>

            <CollapsibleTrigger
              render={
                <Button variant="ghost" size="icon">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${logsOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              }
            ></CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="h-64 overflow-hidden">
              <LogPanel logs={logs} isRunning={isRunning} elapsedSeconds={elapsedSeconds} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
