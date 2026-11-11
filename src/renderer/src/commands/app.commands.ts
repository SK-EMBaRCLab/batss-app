import { MENU_SHORTCUTS } from '@shared/app-menu'
import { Search } from 'lucide-react'

import { useCommandPalette } from '@/stores/command-palette'
import type { AppCommand } from '@/types/command'

export const appCommands: AppCommand[] = [
  {
    id: 'open-command-palette',
    label: 'Search Commands',
    group: 'Application',
    icon: Search,
    shortcut: {
      binding: MENU_SHORTCUTS['open-command-palette']
    },
    showInPalette: false,
    action: () => {
      useCommandPalette.getState().toggle()
    }
  }
]
