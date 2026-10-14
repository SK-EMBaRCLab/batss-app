import { CheckCircle2, CircleAlert, CircleOff, Clock, SquareStack } from 'lucide-react'
import { type ReactElement } from 'react'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { useDesign } from '@/stores/design'

export function DashboardStats(): ReactElement | null {
  const design = useDesign((s) => s.design)

  if (!design) {
    return null
  }

  const latestRun = design.results.at(-1)

  return (
    <ItemGroup className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <SquareStack />
        </ItemMedia>
        <ItemContent>
          <ItemDescription>Total Runs</ItemDescription>
          <ItemTitle>{design.results.length}</ItemTitle>
        </ItemContent>
      </Item>

      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          {latestRun?.result.status === 'success' ? (
            <CheckCircle2 className="text-green-700 dark:text-green-200" />
          ) : latestRun?.result.status === 'cancelled' ? (
            <CircleOff className="text-muted-foreground" />
          ) : (
            <CircleAlert className="text-destructive" />
          )}
        </ItemMedia>
        <ItemContent>
          <ItemDescription>Latest Status</ItemDescription>
          <ItemTitle>
            {' '}
            {latestRun?.result.status === 'success'
              ? 'Success'
              : latestRun?.result.status === 'cancelled'
                ? 'Cancelled'
                : 'Error'}
          </ItemTitle>
        </ItemContent>
      </Item>

      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <Clock />
        </ItemMedia>
        <ItemContent>
          <ItemDescription>Last Run</ItemDescription>
          <ItemTitle>{latestRun ? new Date(latestRun.createdAt).toLocaleString() : '—'}</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
