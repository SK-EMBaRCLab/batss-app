import { FilePlus2, FolderOpen, FolderSearch, MoreHorizontal, Save } from 'lucide-react'
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
  canSave,
  onShowInFolder,
  canShowInFolder
}: {
  onNew: () => void
  onLoad: () => void
  onSave: () => void
  canSave: boolean
  onShowInFolder: () => void
  canShowInFolder: boolean
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
        {/* New, Open and Save are header buttons from lg up; only listed here below that */}
        <DropdownMenuItem onClick={onNew} className="lg:hidden">
          <FilePlus2 />
          New Design
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onLoad} className="lg:hidden">
          <FolderOpen />
          Open Design
        </DropdownMenuItem>

        <DropdownMenuItem disabled={!canSave} onClick={onSave} className="lg:hidden">
          <Save />
          Save
        </DropdownMenuItem>

        <DropdownMenuItem disabled={!canShowInFolder} onClick={onShowInFolder}>
          <FolderSearch />
          Show in Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
