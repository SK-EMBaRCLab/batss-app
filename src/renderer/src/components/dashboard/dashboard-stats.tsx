import { CheckCircle2, CircleAlert, Clock, Package, SquareStack } from 'lucide-react'
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
  const latestRun = design?.results.at(-1)

  if (!design) {
    return null
  }

  return (
    <ItemGroup className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <CheckCircle2 className="text-primary" />
          ) : (
            <CircleAlert className="text-destructive" />
          )}
        </ItemMedia>
        <ItemContent>
          <ItemDescription>Latest Status</ItemDescription>
          <ItemTitle>{latestRun?.result.status === 'success' ? 'Success' : 'Error'}</ItemTitle>
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

      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <Package />
        </ItemMedia>
        <ItemContent>
          <ItemDescription>BATSS Version</ItemDescription>
          <ItemTitle>
            {latestRun?.result.status === 'success' ? `v${latestRun.result.package}` : '—'}
          </ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
