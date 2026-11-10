import { toBlob } from 'html-to-image'
import { ImageDown, Minus, MoreHorizontal } from 'lucide-react'
import { type ReactElement, useRef, useState } from 'react'

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
import { toast } from '@/components/ui/toast'
import { runExportFileName, saveExport } from '@/lib/download'
import { requestFailed } from '@/lib/error-reference'
import { hasSuperiorOutcome } from '@/lib/results-labels'
import { useDesign, useSelectedEntry } from '@/stores/design'

import { ResultsBarChart } from './bar-chart'

export function RunSummaryChart(): ReactElement | null {
  const [options, setOptions] = useState({
    reference: true
  })
  const chartRef = useRef<HTMLDivElement>(null)

  const selectedEntry = useSelectedEntry()
  const designName = useDesign((state) => state.design?.name ?? '')

  const download = async (): Promise<void> => {
    if (!chartRef.current || !selectedEntry) return

    // The card's own background, so a dark-mode export isn't light text on
    // white
    const card = chartRef.current.closest('[data-slot="card"]') ?? document.body
    const backgroundColor = getComputedStyle(card).backgroundColor

    try {
      const image = await toBlob(chartRef.current, {
        pixelRatio: 2, // higher resolution
        backgroundColor
      })

      if (!image) throw new Error('The chart could not be drawn as an image')
      await saveExport(
        runExportFileName(designName, 'chart', selectedEntry.createdAt, 'png'),
        image
      )
    } catch (error) {
      const failure = requestFailed(error, 'chart export', 'Try again.')
      toast.add({ type: 'error', title: "Couldn't export the chart", description: failure.message })
    }
  }

  const result = selectedEntry?.result

  if (!result || result.status !== 'success') {
    return null
  }

  return (
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
                  <span className="sr-only">Chart options</span>
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
              {/* The lines are targets for the Experimental Superior bar,
                  so there's nothing to toggle without a superiority rule */}
              {hasSuperiorOutcome(result.chart) && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          The following graph summarizes the probabilities of each trial outcome across the
          simulated scenarios. Each bar represents a scenario and the probabilities of each trial
          outcome
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div ref={chartRef}>
          <ResultsBarChart data={result.chart} showRefLines={options.reference} />
        </div>
      </CardContent>
    </Card>
  )
}
