import { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { ChevronDown, Square } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import { SimulationForm } from '@/components/simulation/form'
import { LogPanel } from '@/components/simulation/log-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useDesign } from '@/stores/design'
import { useEngine } from '@/stores/engine'
import { useNavigation } from '@/stores/navigation'
import { useSimulation } from '@/stores/simulation'

export default function Simulation(): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const design = useDesign((s) => s.design)
  const busy = useEngine((s) => s.busy)
  const isRunning = busy === 'simulation'
  const logs = useSimulation((s) => s.logs)
  const startedAt = useSimulation((s) => s.startedAt)
  const endedAt = useSimulation((s) => s.endedAt)
  const run = useSimulation((s) => s.run)
  const cancel = useSimulation((s) => s.cancel)

  const [logsOpen, setLogsOpen] = useState(isRunning)

  const handleRun = async (input: SimulationRunInput, formInput: DesignInput): Promise<void> => {
    setLogsOpen(true)
    const result = await run(input, formInput)

    // Only auto-jump if the user is still on this page.
    if (result.status === 'success' && useNavigation.getState().currentView === 'simulation') {
      navigate('results')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {design?.name ?? 'BATSS Simulation Design'}
              {design && design.results.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {design.results.length} run{design.results.length === 1 ? '' : 's'} so far
                </span>
              )}
            </CardTitle>
            {isRunning && (
              <Button variant="destructive" size="sm" onClick={() => cancel()}>
                <Square className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
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
              <LogPanel logs={logs} isRunning={isRunning} startedAt={startedAt} endedAt={endedAt} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
