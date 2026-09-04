import { type ReactElement, useMemo } from 'react'

import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useDesign } from '@/stores/design'

import { outcomeTypes } from './columns'

export function RunsHistory(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedResults = useDesign((state) => state.selectedResults)
  const selectResult = useDesign((state) => state.selectResult)

  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )

  if (!design || design.results.length === 0) {
    return null
  }

  let list = design.results

  if (selectedResults && selectedResults.length > 0) {
    list = design.results.filter((entry) => selectedResults.includes(entry.id))
  }
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border p-4">
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
                className={cn('border-border', entry.id === selectedEntry?.id && 'border-primary')}
                onClick={() => selectResult(entry.id)}
              />
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
