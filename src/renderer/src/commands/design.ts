import { FilePlus2, FolderOpen, Save, SavePen } from 'lucide-react'

import { initialDesignInput } from '@/lib/schema'
import { useDesign } from '@/stores/design'
import type { AppCommand } from '@/types/command'

export const designCommands: AppCommand[] = [
  {
    id: 'new-design',
    label: 'New Design',
    group: 'Design',
    icon: FilePlus2,
    shortcut: {
      binding: 'mod+n'
    },
    showInPalette: true,
    showInMenu: true,
    action: async () => {
      // You need to provide the input from your UI/wizard
      // This command usually opens a "New Design" dialog
      await useDesign.getState().newDesign(initialDesignInput)
    }
  },
  {
    id: 'open-design',
    label: 'Open Design',
    group: 'Design',
    icon: FolderOpen,
    shortcut: {
      binding: 'mod+o'
    },
    showInPalette: true,
    showInMenu: true,
    action: async () => {
      await useDesign.getState().loadDesign()
    }
  },
  {
    id: 'save-design',
    label: 'Save Design',
    group: 'Design',
    icon: Save,
    shortcut: {
      binding: 'mod+s'
    },
    showInPalette: true,
    showInMenu: true,
    enabled: () => useDesign.getState().isDirty,
    action: async () => {
      await useDesign.getState().saveDesign()
    }
  },
  {
    id: 'save-design-as',
    label: 'Save Design As…',
    group: 'Design',
    icon: SavePen,
    shortcut: { binding: 'mod+shift+s' },
    showInPalette: true,
    showInMenu: true,
    enabled: () => !!useDesign.getState().design,
    action: async () => {
      await useDesign.getState().saveDesignAs()
    }
  }
]
