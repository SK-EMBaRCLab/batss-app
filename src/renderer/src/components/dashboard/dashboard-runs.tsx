import { type ReactElement, useMemo } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import { Button } from '@/components/ui/button'
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
import { runResultDetail } from '@/lib/run-status'
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
            <Item
              key={entry.id}
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => openResult(entry.id)}
            >
              <ItemMedia>
                <RunStatusIcon status={entry.result.status} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                <ItemDescription>
                  {runResultDetail(entry.result)}
                  {entry.result.durationMs != null &&
                    ` · ${formatDurationLabel(entry.result.durationMs / 1000)}`}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
