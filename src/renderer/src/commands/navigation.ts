import { useNavigation } from '@/stores/navigation'
import type { AppCommand } from '@/types/command'
import { Home } from 'lucide-react'

export const navigationCommands: AppCommand[] = [
  {
    id: 'go-dashboard',
    label: 'Go to Dashboard',
    group: 'Navigation',
    icon: Home,
    shortcut: {
      binding: 'mod+1'
    },
    showInPalette: true,
    showInMenu: true,
    action: () => {
      useNavigation.getState().navigate('dashboard')
    }
  }
]
