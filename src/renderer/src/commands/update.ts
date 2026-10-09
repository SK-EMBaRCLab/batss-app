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
    showInMenu: true,
    enabled: () => {
      const status = useUpdate.getState().status
      return status !== 'checking' && status !== 'downloading'
    },
    action: async () => {
      const { status, install, check } = useUpdate.getState()

      if (status === 'downloaded') {
        install()
        return
      }

      await check()
    }
  }
]
