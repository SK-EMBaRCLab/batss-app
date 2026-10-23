import { Clock, SquareStack } from 'lucide-react'
import { type ReactElement } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { runStatusLabel } from '@/lib/run-status'
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
          {latestRun && <RunStatusIcon status={latestRun.result.status} />}
        </ItemMedia>
        <ItemContent>
          <ItemDescription>Latest Status</ItemDescription>
          <ItemTitle>{latestRun ? runStatusLabel(latestRun.result.status) : '—'}</ItemTitle>
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
