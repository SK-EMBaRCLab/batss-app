import { CheckCircle2, CircleAlert } from 'lucide-react'
import { type ReactElement, useMemo } from 'react'

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
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

type DashboardRecentRunsProps = {
  viewAllResults: () => void
}

export function DashboardRecentRuns({
  viewAllResults
}: DashboardRecentRunsProps): ReactElement | null {
  const design = useDesign((s) => s.design)
  const selectResult = useDesign((s) => s.selectResult)
  const selectResults = useDesign((s) => s.selectResults)
  const navigate = useNavigation((s) => s.navigate)

  const recentRuns = useMemo(() => [...(design?.results ?? [])].reverse().slice(0, 5), [design])

  if (!design) {
    return null
  }

  const openResult = (id: string): void => {
    selectResult(id)
    selectResults([id])
    navigate('results')
  }

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
                {entry.result.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-destructive" />
                )}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                <ItemDescription>
                  {entry.result.status === 'success'
                    ? `BATSS v${entry.result.package}`
                    : entry.result.message}
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
