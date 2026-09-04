import { toPng } from 'html-to-image'
import { ImageDown, Minus, MoreHorizontal, Play } from 'lucide-react'
import { type ReactElement, useMemo, useRef, useState } from 'react'

import { DesignParams } from '@/components/design-parameters'
import { ResultsBarChart } from '@/components/results/bar-chart'
import { outcomeTypes } from '@/components/results/columns'
import { SampleSizeTable } from '@/components/results/sample-size-table'
import { SummaryTable } from '@/components/results/summary-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export default function Results(): ReactElement {
  const [options, setOptions] = useState({
    reference: true
  })
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedResults = useDesign((state) => state.selectedResults)
  const selectResult = useDesign((state) => state.selectResult)
  const loadDesign = useDesign((state) => state.loadDesign)
  const navigate = useNavigation((state) => state.navigate)
  const chartRef = useRef<HTMLDivElement>(null)

  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )

  const download = async (): Promise<void> => {
    if (!chartRef.current) return

    const dataUrl = await toPng(chartRef.current, {
      pixelRatio: 2, // higher resolution
      backgroundColor: '#fff'
    })

    const link = document.createElement('a')
    link.download = 'results-chart.png'
    link.href = dataUrl
    link.click()
  }

  if (!design || design.results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Results Yet</EmptyTitle>
            <EmptyDescription>
              Run a BATSS simulation for this design, or load a saved design to view its results.
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="flex-row gap-2 justify-center">
            <Button onClick={() => navigate('simulation')}>
              <Play className="mr-2 h-4 w-4" />
              Run Simulation
            </Button>
            <Button variant="outline" onClick={loadDesign}>
              Load Design
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const result = selectedEntry?.result
  const input = selectedEntry?.input

  let list = design.results

  if (selectedResults && selectedResults.length > 0) {
    list = design.results.filter((entry) => selectedResults.includes(entry.id))
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 overflow-hidden p-6">
      {/* Run history for this design */}
      <div className="flex h-full w-64 shrink-0 flex-col border-r border-border p-4">
        <h2 className="mb-1 truncate text-sm font-semibold">{design.name}</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {list.length} run{list.length === 1 ? '' : 's'}
        </p>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pr-2">
            {[...list].reverse().map((entry) => {
              const Icon = outcomeTypes.find((type) => type.value === entry.input.outcomeType)?.icon
              return (
                <Item
                  key={entry.id}
                  render={
                    <a href="#">
                      <ItemContent>
                        <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                        <ItemDescription>
                          {entry.result.status === 'success' ? 'Success' : 'Error'}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>{Icon ? <Icon /> : null}</ItemActions>
                    </a>
                  }
                  variant={entry.id === selectedEntry?.id ? 'outline' : 'muted'}
                  className={cn(
                    'border-border',
                    entry.id === selectedEntry?.id && 'border-primary'
                  )}
                  onClick={() => selectResult(entry.id)}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Selected run detail */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Results</h1>
              <p className="text-muted-foreground">Posterior summaries, diagnostics, and plots.</p>
            </div>

            {result?.status === 'success' && (
              <Badge variant="secondary">
                {result.package ? `BATSS v${result.package}` : 'BATSS'}
              </Badge>
            )}
          </div>

          {input && (
            <Card>
              <CardHeader>
                <CardTitle>Simulation Design Parameters</CardTitle>
              </CardHeader>

              <CardContent>
                <DesignParams input={input} />
              </CardContent>
            </Card>
          )}

          {result?.status === 'error' && (
            <Card>
              <CardHeader>
                <CardTitle>Simulation Error</CardTitle>
              </CardHeader>
              <CardContent>{result.message}</CardContent>
            </Card>
          )}

          {result?.status === 'success' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Simulated Trial Outcome Probability Summary by Scenario</CardTitle>
                  <CardDescription>
                    The following table summarizes that probabilities of each trial outcome across
                    the simulated scenarios. Each column represents a scenario and the probabilities
                    of each trial outcome
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <SummaryTable rows={result.table} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Graphical Summary of Simulated Trial Outcome Probabilities by Scenario
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Chart</DropdownMenuLabel>

                          <DropdownMenuItem onClick={download}>
                            <ImageDown className="h-4 w-4" />
                            Export Chart
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Chart Options</DropdownMenuLabel>
                          <DropdownMenuCheckboxItem
                            checked={options.reference}
                            onCheckedChange={(checked) =>
                              setOptions({ ...options, reference: checked === true })
                            }
                          >
                            <Minus />
                            Reference Line
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    The following graph summarizes that probabilities of each trial outcome across
                    the simulated scenarios. Each bar represents a scenario and the probabilities of
                    each trial outcome
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div ref={chartRef}>
                    <ResultsBarChart data={result.chart} showRefLines={options.reference} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Simulated Sample Size Summary by Scenario</CardTitle>
                  <CardDescription>
                    The following tables summarize the simulated sample size distributions under
                    both the null effect and target treatment effect scenarios. For each scenario,
                    the tables present the mean, minimum, maximum, and a user-selected quantile of
                    the sample size distribution. Sample sizes are reported for the total study
                    population as well as separately for the control and experimental treatment
                    arms. The quantile slider determines the percentile displayed in the quantile
                    column. For example, setting the slider to 0.80 displays the 80th percentile
                    sample size, meaning that 80% of simulated trials reached a conclusion before or
                    at the reported sample size
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <SampleSizeTable sampleSize={result.sampleSize} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
