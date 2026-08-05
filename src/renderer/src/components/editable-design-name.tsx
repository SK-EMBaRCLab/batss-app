import { JSX, useCallback, useState } from 'react'
import { Pencil } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function EditableDesignName({
  name,
  onRename,
  className
}: {
  name: string
  onRename: (name: string) => void
  className?: string
}): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const startEditing = (): void => {
    setDraft(name)
    setIsEditing(true)
  }

  const commit = (): void => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name) {
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
        onChange={(event) => setDraft(event.target.value)}
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
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        'group/rename flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground hover:bg-muted',
        className
      )}
      title="Rename study design"
    >
      <span className="max-w-56 truncate">{name}</span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/rename:opacity-100" />
    </button>
  )
}
