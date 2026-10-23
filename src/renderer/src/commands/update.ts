import { RefreshCw } from 'lucide-react'

import { useUpdate } from '@/stores/update'
import type { AppCommand } from '@/types/command'

export const updateCommands: AppCommand[] = [
  {
    id: 'check-for-updates',
    label: 'Check for Updates',
    group: 'Application',
    icon: RefreshCw,
    showInPalette: true,
    enabled: () => {
      const status = useUpdate.getState().status
      return status !== 'checking' && status !== 'downloading'
    },
    action: async () => {
      await useUpdate.getState().advance()
    }
  }
]
