import { type ReactElement, useEffect, useRef } from 'react'

import { RunStatusIcon } from '@/components/common/run-status-icon'
import { Button } from '@/components/ui/button'
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
import { formatRunDate, formatRunDuration } from '@/lib/run-format'
import { runStatusLabel } from '@/lib/run-status'
import { cn } from '@/lib/utils'
import { useDesign, useSelectedEntry } from '@/stores/design'

export function RunsHistory(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResults = useDesign((state) => state.selectedResults)
  const selectResult = useDesign((state) => state.selectResult)
  const showAllResults = useDesign((state) => state.showAllResults)

  const selectedEntry = useSelectedEntry()

  // Brings the run being viewed into view in the list, e.g. one opened
  // from the runs table that's further down, or after Show all runs puts
  // the other runs back around it. 'nearest' scrolls only as far as
  // needed, and not at all when it's already visible.
  const selectedButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    selectedButton.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedEntry?.id, selectedResults])

  if (!design || design.results.length === 0) {
    return null
  }

  // Narrowed to the runs being compared, if any (see openResults)
  const comparing = selectedResults !== null && selectedResults.length > 0
  const list = comparing
    ? design.results.filter((entry) => selectedResults.includes(entry.id))
    : design.results

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border p-4">
      <h2 className="mb-1 truncate text-sm font-semibold">{design.name}</h2>
      {comparing ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-xs text-muted-foreground">
            Comparing {list.length} of {design.results.length} runs
          </p>
          <Button variant="link" size="xs" className="h-auto p-0" onClick={showAllResults}>
            Show all runs
          </Button>
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">
          {list.length} run{list.length === 1 ? '' : 's'}
        </p>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 pr-4">
          {[...list].reverse().map((entry) => {
            const Icon = outcomeTypes.find((type) => type.value === entry.input.outcomeType)?.icon
            const isSelected = entry.id === selectedEntry?.id
            const createdAt = formatRunDate(entry.createdAt)
            const duration = formatRunDuration(entry.result.durationMs)
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
                    {duration && ` · ${duration}`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>{Icon ? <Icon aria-hidden /> : null}</ItemActions>
                <button
                  type="button"
                  aria-label={`${createdAt}, ${runStatusLabel(entry.result.status)}`}
                  aria-current={isSelected ? 'true' : undefined}
                  ref={isSelected ? selectedButton : undefined}
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
