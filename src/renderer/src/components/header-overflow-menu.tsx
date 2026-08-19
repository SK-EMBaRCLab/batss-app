import { FilePlus2, FolderOpen, MoreHorizontal, Save, Settings } from 'lucide-react'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export function HeaderOverflowMenu({
  onNew,
  onLoad,
  onSave,
  onSettings,
  canSave
}: {
  onNew: () => void
  onLoad: () => void
  onSave: () => void
  onSettings: () => void
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

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSettings}>
          <Settings />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
