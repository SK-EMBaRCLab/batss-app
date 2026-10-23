import { type ReactElement } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
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
import { runStatusLabel } from '@/lib/run-status'
import { cn, formatDurationLabel } from '@/lib/utils'
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
            const createdAt = new Date(entry.createdAt).toLocaleString()
            return (
              // A div with a full-size button laid over it, rather than the
              // Item rendered as a <button>: Item's parts are divs and a <p>,
              // which aren't valid inside a button
              <Item
                key={entry.id}
                variant={isSelected ? 'outline' : 'muted'}
                className={cn(
                  'relative border-border hover:bg-muted',
                  isSelected && 'border-primary'
                )}
              >
                <ItemMedia variant="icon">
                  <RunStatusIcon status={entry.result.status} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{createdAt}</ItemTitle>
                  <ItemDescription>
                    {runStatusLabel(entry.result.status)}
                    {entry.result.durationMs != null &&
                      ` · ${formatDurationLabel(entry.result.durationMs / 1000)}`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>{Icon ? <Icon aria-hidden /> : null}</ItemActions>
                <button
                  type="button"
                  aria-label={`${createdAt}, ${runStatusLabel(entry.result.status)}`}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => selectResult(entry.id)}
                  className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Item>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
