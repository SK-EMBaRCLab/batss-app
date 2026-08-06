import { type ReactElement, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'

import { useDesign } from '@/stores/design'
import { Button } from '@/components/ui/button'
import { ResultsBarChart } from '@/components/results/bar-chart'
import { SummaryTable } from '@/components/results/summary-table'
import { ImageDown, Minus, MoreHorizontal, Play } from 'lucide-react'
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
import { useNavigation } from '@/stores/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export default function Results(): ReactElement {
  const [options, setOptions] = useState({
    reference: true
  })
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
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

  return (
    <div className="flex h-full min-h-0 min-w-0 overflow-hidden p-6">
      {/* Run history for this design */}
      <div className="flex h-full w-64 shrink-0 flex-col border-r border-border p-4">
        <h2 className="mb-1 truncate text-sm font-semibold">{design.name}</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {design.results.length} run{design.results.length === 1 ? '' : 's'}
        </p>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pr-2">
            {[...design.results].reverse().map((entry) => (
              <button
                key={entry.id}
                onClick={() => selectResult(entry.id)}
                className={cn(
                  'rounded-md border border-border p-2 text-left text-xs transition-colors hover:bg-muted',
                  entry.id === selectedEntry?.id && 'border-primary bg-accent'
                )}
              >
                <div className="font-medium">{new Date(entry.createdAt).toLocaleString()}</div>
                <div className="text-muted-foreground">
                  {entry.result.status === 'success' ? 'Success' : 'Error'}
                </div>
              </button>
            ))}
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
                <CardTitle>Simulation Design</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-3">
                  <Parameter label="Primary Outcome" value={input.primaryOutcome} />
                  <Parameter label="Probability" value={input.probability} />
                  <Parameter label="Log Odds" value={input.logOdds} />
                  <Parameter label="Delta Eff" value={input.deltaEff} />
                  <Parameter label="Decision Rule (b)" value={input.b} />
                  <Parameter label="N" value={input.N} />
                  <Parameter label="m0" value={input.m0} />
                  <Parameter label="m" value={input.m} />
                  <Parameter label="R" value={input.R} />
                </div>
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
                  <CardTitle>Summary</CardTitle>
                </CardHeader>

                <CardContent>
                  <SummaryTable rows={result.table} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Chart Data</CardTitle>
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
                </CardHeader>

                <CardContent>
                  <div ref={chartRef}>
                    <ResultsBarChart data={result.chart} showRefLines={options.reference} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Parameter({ label, value }: { label: string; value: string | number }): ReactElement {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
