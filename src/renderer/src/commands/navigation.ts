import { MENU_SHORTCUTS } from '@shared/app-menu'
import { Home } from 'lucide-react'

import { useNavigation } from '@/stores/navigation'
import type { AppCommand } from '@/types/command'

export const navigationCommands: AppCommand[] = [
  {
    id: 'go-dashboard',
    label: 'Go to Dashboard',
    group: 'Navigation',
    icon: Home,
    shortcut: {
      binding: MENU_SHORTCUTS['go-dashboard']
    },
    showInPalette: true,
    action: () => {
      useNavigation.getState().navigate('dashboard')
    }
  }
]
