import { type ReactElement, useMemo } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { runResultDetail, runStatusLabel } from '@/lib/run-status'
import { formatDurationLabel } from '@/lib/utils'
import { useDesign } from '@/stores/design'

type DashboardRecentRunsProps = {
  viewAllResults: () => void
}

export function DashboardRecentRuns({
  viewAllResults
}: DashboardRecentRunsProps): ReactElement | null {
  const design = useDesign((s) => s.design)
  const openResults = useDesign((s) => s.openResults)

  const recentRuns = useMemo(() => [...(design?.results ?? [])].reverse().slice(0, 5), [design])

  if (!design) {
    return null
  }

  const openResult = (id: string): void => openResults([id])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>Latest results for this design.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => viewAllResults()}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {recentRuns.map((entry) => (
            // A full-size button over the item, as in the Results page's run
            // list: one focusable control per run, named for it, rather than
            // a click on a box the keyboard can't reach
            <Item key={entry.id} variant="outline" size="sm" className="relative hover:bg-muted/50">
              <ItemMedia>
                <RunStatusIcon status={entry.result.status} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                <ItemDescription>
                  {runResultDetail(entry.result) ?? runStatusLabel(entry.result.status)}
                  {entry.result.durationMs != null &&
                    ` · ${formatDurationLabel(entry.result.durationMs / 1000)}`}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {/* Looks like a button; the whole item is the button */}
                <span aria-hidden className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  View
                </span>
              </ItemActions>
              <button
                type="button"
                aria-label={`View the run from ${new Date(entry.createdAt).toLocaleString()}, ${runStatusLabel(entry.result.status)}`}
                onClick={() => openResult(entry.id)}
                className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
