import { FileText, X } from 'lucide-react'
import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { useRecentDesigns } from '@/hooks/use-recent-designs'
import { formatRunDate } from '@/lib/run-format'
import { cn } from '@/lib/utils'
import { useDesign } from '@/stores/design'

/** The designs opened or saved most recently, each opened with one click. */
export function RecentDesignsList(): ReactElement | null {
  const { recent, forget, clear } = useRecentDesigns()
  const loadDesign = useDesign((state) => state.loadDesign)

  if (recent.length === 0) return null

  return (
    <section className="flex flex-col gap-2" aria-labelledby="recent-designs-heading">
      <div className="flex items-center justify-between">
        <h2 id="recent-designs-heading" className="text-sm font-medium">
          Recent designs
        </h2>
        <Button variant="link" size="xs" className="h-auto p-0" onClick={() => void clear()}>
          Clear list
        </Button>
      </div>

      <ul className="flex flex-col gap-1">
        {recent.map((item) => (
          <li key={item.id} className="group flex items-center gap-1">
            <button
              type="button"
              disabled={!item.found}
              onClick={() => void loadDesign(item.id)}
              className={cn(
                'flex min-w-0 flex-1 items-start gap-3 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                !item.found && 'cursor-not-allowed opacity-50 hover:bg-transparent'
              )}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                  {!item.found && <span className="font-normal"> (not found)</span>}
                </span>
                {item.description && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
                <span className="block truncate text-xs text-muted-foreground">
                  {item.folder} · {formatRunDate(item.openedAt)}
                </span>
              </span>
            </button>

            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${item.name} from recent designs`}
              // Always shown for a file that's gone, the one most worth removing
              className={cn(
                'group-hover:opacity-100 focus-visible:opacity-100',
                item.found && 'opacity-0'
              )}
              onClick={() => void forget(item.id)}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
