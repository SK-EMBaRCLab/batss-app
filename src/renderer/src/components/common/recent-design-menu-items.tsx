import { FileText } from 'lucide-react'
import { type ReactElement } from 'react'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useRecentDesigns } from '@/hooks/use-recent-designs'
import { useDesign } from '@/stores/design'

/**
 * The recent designs as menu items, for the header's Recent menu and the
 * "…" menu's Open Recent. Read each time the menu opens (its items only
 * exist while it's open), so moved files show as not found.
 */
export function RecentDesignMenuItems(): ReactElement {
  const { recent } = useRecentDesigns()
  const loadDesign = useDesign((state) => state.loadDesign)

  if (recent.length === 0) {
    return <DropdownMenuItem disabled>No recent designs</DropdownMenuItem>
  }

  return (
    <>
      {recent.map((item) => (
        <DropdownMenuItem
          key={item.id}
          disabled={!item.found}
          // Through loadDesign, so unsaved changes are asked about first
          onClick={() => void loadDesign(item.id)}
        >
          <FileText />
          <span className="flex min-w-0 flex-col">
            <span className="max-w-72 truncate">
              {item.name}
              {!item.found && ' (not found)'}
            </span>
            <span className="max-w-72 truncate text-xs text-muted-foreground">{item.folder}</span>
          </span>
        </DropdownMenuItem>
      ))}
    </>
  )
}
