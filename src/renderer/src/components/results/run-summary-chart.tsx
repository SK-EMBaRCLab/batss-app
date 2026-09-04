import { toPng } from 'html-to-image'
import { ImageDown, Minus, MoreHorizontal } from 'lucide-react'
import { type ReactElement, useMemo, useRef, useState } from 'react'

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
import { useDesign } from '@/stores/design'

import { ResultsBarChart } from './bar-chart'

export function RunSummaryChart(): ReactElement | null {
  const [options, setOptions] = useState({
    reference: true
  })
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
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

  const result = selectedEntry?.result

  if (!result || result.status === 'error') {
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
          The following graph summarizes that probabilities of each trial outcome across the
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
