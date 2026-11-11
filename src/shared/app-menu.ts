// What the operating system's menu bar and the window share. The window's
// commands (renderer src/commands) do the work; the main process builds
// the menu (main/menu) and sends a picked item to the window. The keyboard
// shortcuts live here so the menu, which handles them, and the command
// palette, which shows them, always agree.

/** The commands in the menu, by their command id. */
export const MENU_COMMAND_IDS = [
  'new-design',
  'open-design',
  'save-design',
  'save-design-as',
  'show-design-in-folder',
  'open-command-palette',
  'check-for-updates'
] as const

export type MenuCommandId = (typeof MENU_COMMAND_IDS)[number]

/**
 * Keyboard shortcuts, written as the command palette shows them ("mod" is
 * ⌘ on macOS, Ctrl elsewhere). The menu registers them, so each key is
 * handled in one place.
 */
export const MENU_SHORTCUTS = {
  'new-design': 'mod+n',
  'open-design': 'mod+o',
  'save-design': 'mod+s',
  'save-design-as': 'mod+shift+s',
  'open-command-palette': 'mod+k',
  'go-dashboard': 'mod+1'
} as const

/** The pages the View menu opens, as the window's views name them. */
export const MENU_VIEWS = [
  { view: 'dashboard', label: 'Dashboard', shortcut: MENU_SHORTCUTS['go-dashboard'] },
  { view: 'simulation', label: 'Run Simulation' },
  { view: 'batch', label: 'Batch Processing' },
  { view: 'table', label: 'Simulations Table' },
  { view: 'results', label: 'Results' }
] as const

export type MenuView = (typeof MENU_VIEWS)[number]['view'] | 'settings' | 'about'

/** What the window tells the main process, so menu items are greyed out as in the app. */
export type MenuState = {
  // The pages need a design open (without one the app shows the welcome screen)
  hasDesign: boolean
  enabled: Record<MenuCommandId, boolean>
}

/** A menu item the window carries out. */
export type MenuAction =
  | { type: 'command'; id: MenuCommandId }
  | { type: 'navigate'; view: MenuView }
  | { type: 'open-recent'; id: string }

/** "mod+shift+s" as Electron's accelerator, "CmdOrCtrl+Shift+S". */
export function toAccelerator(binding: string): string {
  return binding
    .split('+')
    .map((part) => {
      if (part === 'mod') return 'CmdOrCtrl'
      return part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)
    })
    .join('+')
}
