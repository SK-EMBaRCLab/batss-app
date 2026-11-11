import { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { ChevronDown, History } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import { SimulationForm } from '@/components/simulation/form'
import { SimulationStatus } from '@/components/simulation/simulation-status'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
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
  const openCount = useDesign((s) => s.openCount)
  const startFrom = useDesign((s) => s.startFrom)
  const startFromCount = useDesign((s) => s.startFromCount)
  const clearStartFrom = useDesign((s) => s.clearStartFrom)
  const busy = useEngine((s) => s.busy)
  const isRunning = busy === 'simulation'
  const logs = useSimulation((s) => s.logs)
  const startedAt = useSimulation((s) => s.startedAt)
  const endedAt = useSimulation((s) => s.endedAt)
  const stage = useSimulation((s) => s.stage)
  const stageStartedAt = useSimulation((s) => s.stageStartedAt)
  const estimate = useSimulation((s) => s.estimate)
  const lastResult = useSimulation((s) => s.lastResult)
  const runOpenCount = useSimulation((s) => s.designOpenCount)
  const run = useSimulation((s) => s.run)

  const [logsOpen, setLogsOpen] = useState(isRunning)

  // Always show a run in progress. Once it's finished, keep failures and
  // cancellations around for this design only; a success already lives
  // on the Results page.
  const showProgress =
    logs.length > 0 &&
    (isRunning || (runOpenCount === openCount && lastResult?.status !== 'success'))

  const handleRun = async (input: SimulationRunInput, formInput: DesignInput): Promise<void> => {
    setLogsOpen(true)
    const result = await run(input, formInput)

    // The design's settings are now these, so there's nothing to go back to
    if (result.status === 'success') clearStartFrom()

    if (result.status !== 'success') {
      setLogsOpen(true)
    }

    // Only auto-jump if the user is still on this page.
    if (result.status === 'success' && useNavigation.getState().currentView === 'simulation') {
      navigate('results')
    }
  }

  return (
    // Wider than the other capped pages: the form card plus the help card
    // beside it fill the space a single centred form would leave empty
    <div className="mx-auto flex h-full min-h-0 w-full max-w-352 flex-col gap-4 p-6">
      {startFrom && (
        <Alert className="shrink-0">
          <History />
          <AlertDescription>
            Starting from the run of {startFrom.runLabel}. Change what you need, then run it.
          </AlertDescription>
          <AlertAction>
            <Button variant="link" size="sm" disabled={isRunning} onClick={clearStartFrom}>
              Use the latest run&apos;s settings instead
            </Button>
          </AlertAction>
        </Alert>
      )}

      <SimulationForm
        // The form only reads initialInput when it mounts; remount for a new
        // or loaded design, or a new starting point, so it doesn't keep the
        // previous values
        key={`${openCount}-${startFromCount}`}
        onRun={handleRun}
        initialInput={startFrom?.input ?? design?.input}
        startOnReview={startFrom !== null}
        header={
          <CardTitle>
            {design?.name}
            {design && design.results.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {design.results.length} run{design.results.length === 1 ? '' : 's'} so far
              </span>
            )}
          </CardTitle>
        }
      />
      {showProgress && (
        <Card className="shrink-0">
          <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Simulation Progress</CardTitle>

              <CollapsibleTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${logsOpen ? 'rotate-180' : ''}`}
                    />
                    <span className="sr-only">Toggle simulation progress</span>
                  </Button>
                }
              ></CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent>
                <SimulationStatus
                  logs={logs}
                  startedAt={startedAt}
                  endedAt={endedAt}
                  stage={stage}
                  stageStartedAt={stageStartedAt}
                  estimate={estimate}
                  lastResult={lastResult}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  )
}
