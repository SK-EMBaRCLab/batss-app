import { Pencil } from 'lucide-react'
import { type ReactElement, useCallback, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function EditableInPlaceInput({
  name,
  title,
  hint,
  emptyLabel,
  maxLength,
  onRename,
  className
}: {
  name: string
  title: string
  // Extra line under the tooltip's title, e.g. where the design is saved
  hint?: string
  // Shown while there's no name. Given, the name can be cleared (an
  // empty name is passed on); without it, an empty name is ignored
  emptyLabel?: string
  maxLength?: number
  onRename: (name: string) => void
  className?: string
}): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const startEditing = (): void => {
    setDraft(name)
    setIsEditing(true)
  }

  const commit = (): void => {
    const trimmed = draft.trim()
    if ((trimmed || emptyLabel !== undefined) && trimmed !== name) {
      onRename(trimmed)
    }
    setIsEditing(false)
  }

  const cancel = (): void => {
    setIsEditing(false)
  }

  const focusAndSelectOnMount = useCallback((node: HTMLInputElement | null) => {
    node?.focus()
    node?.select()
  }, [])

  if (isEditing) {
    return (
      <Input
        ref={focusAndSelectOnMount}
        value={draft}
        maxLength={maxLength}
        onChange={(event) => setDraft(event.target.value)}
        aria-label={title}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') cancel()
        }}
        className={cn('h-7 max-w-56 text-sm font-medium', className)}
      />
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={startEditing}
            className={cn(
              'group/rename flex max-w-56 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground hover:bg-muted',
              className
            )}
          >
            <span className="min-w-0 truncate">{name || emptyLabel}</span>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/rename:opacity-100" />
          </button>
        }
      />
      <TooltipContent>
        <div>{title}</div>
        {hint && <div className="max-w-80 text-xs break-all opacity-80">{hint}</div>}
      </TooltipContent>
    </Tooltip>
  )
}
