import { FilePlus2, FolderOpen, MoreHorizontal, Save } from 'lucide-react'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export function HeaderOverflowMenu({
  onNew,
  onLoad,
  onSave,
  canSave
}: {
  onNew: () => void
  onLoad: () => void
  onSave: () => void
  canSave: boolean
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
            <span className="sr-only">More actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onNew}>
          <FilePlus2 />
          New Design
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onLoad}>
          <FolderOpen />
          Open Design
        </DropdownMenuItem>

        <DropdownMenuItem disabled={!canSave} onClick={onSave}>
          <Save />
          Save
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
