import type { LucideIcon } from 'lucide-react'

export interface AppShortcut {
  binding: string
}

export type AppCommand = {
  id: string
  label: string
  group: string
  icon?: LucideIcon
  shortcut?: AppShortcut
  showInPalette: boolean
  showInMenu: boolean
  enabled?: () => boolean
  action: () => void | Promise<void>
}
