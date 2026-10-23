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
      binding: 'mod+k'
    },
    showInPalette: false,
    action: () => {
      useCommandPalette.getState().toggle()
    }
  }
]
