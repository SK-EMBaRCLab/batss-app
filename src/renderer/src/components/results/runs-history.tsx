import { ShieldAlertIcon, ShieldCheckIcon, ShieldOffIcon } from 'lucide-react'
import { type ReactElement } from 'react'

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { outcomeTypes } from '@/lib/design-options'
import { cn } from '@/lib/utils'
import { useDesign, useSelectedEntry } from '@/stores/design'

export function RunsHistory(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResults = useDesign((state) => state.selectedResults)
  const selectResult = useDesign((state) => state.selectResult)

  const selectedEntry = useSelectedEntry()

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
        <div className="flex flex-col gap-2 pr-4">
          {[...list].reverse().map((entry) => {
            const Icon = outcomeTypes.find((type) => type.value === entry.input.outcomeType)?.icon
            const isSelected = entry.id === selectedEntry?.id
            return (
              <Item
                key={entry.id}
                render={
                  <button type="button" className="w-full text-left" aria-current={isSelected}>
                    <ItemMedia variant="icon">
                      {entry.result.status === 'success' ? (
                        <ShieldCheckIcon className="text-green-700 dark:text-green-200" />
                      ) : entry.result.status === 'cancelled' ? (
                        <ShieldOffIcon className="text-muted-foreground" />
                      ) : (
                        <ShieldAlertIcon className="text-destructive" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                      <ItemDescription>
                        {entry.result.status === 'success'
                          ? 'Success'
                          : entry.result.status === 'cancelled'
                            ? 'Cancelled'
                            : 'Error'}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>{Icon ? <Icon /> : null}</ItemActions>
                  </button>
                }
                variant={isSelected ? 'outline' : 'muted'}
                className={cn('border-border hover:bg-muted', isSelected && 'border-primary')}
                onClick={() => selectResult(entry.id)}
              />
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
