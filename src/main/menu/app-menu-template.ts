// The menu bar's contents, built from the app's state with no Electron
// calls (only its types), so it can be tested. app-menu.ts installs it.
import type { MenuItemConstructorOptions } from 'electron'

import {
  MENU_SHORTCUTS,
  MENU_VIEWS,
  type MenuAction,
  type MenuCommandId,
  type MenuState,
  toAccelerator
} from '../../shared/app-menu'

export const ISSUES_URL = 'https://github.com/SK-EMBaRCLab/batss-app/issues'
export const BATSS_DOCS_URL = 'https://batss-dev.github.io/BATSS/'

export type RecentMenuEntry = { id: string; name: string }

export type AppMenuOptions = {
  platform: NodeJS.Platform
  // Development builds keep Reload and the developer tools
  isDevelopment: boolean
  state: MenuState
  recent: readonly RecentMenuEntry[]
  // What the items do: the window's own command, or something main does
  run: (action: MenuAction) => void
  clearRecent: () => void
  showErrorLog: () => void
  openUrl: (url: string) => void
}

type Item = MenuItemConstructorOptions
const separator: Item = { type: 'separator' }

export function appMenuTemplate(options: AppMenuOptions): Item[] {
  const { platform, isDevelopment, state, recent, run } = options
  const mac = platform === 'darwin'

  const command = (id: MenuCommandId, label: string, shortcut?: string): Item => ({
    label,
    enabled: state.enabled[id],
    ...(shortcut && { accelerator: toAccelerator(shortcut) }),
    click: () => run({ type: 'command', id })
  })

  const about: Item = {
    label: 'About BATSS Studio',
    click: () => run({ type: 'navigate', view: 'about' })
  }
  const checkForUpdates = command('check-for-updates', 'Check for Updates…')
  const settings: Item = {
    label: mac ? 'Settings…' : 'Settings',
    accelerator: 'CmdOrCtrl+,',
    click: () => run({ type: 'navigate', view: 'settings' })
  }

  const openRecent: Item = {
    label: 'Open Recent',
    submenu: [
      ...(recent.length > 0
        ? recent.map((entry): Item => ({
            label: entry.name,
            enabled: state.enabled['open-design'],
            click: () => run({ type: 'open-recent', id: entry.id })
          }))
        : [{ label: 'No Recent Designs', enabled: false }]),
      separator,
      { label: 'Clear Recent', enabled: recent.length > 0, click: options.clearRecent }
    ]
  }

  const appMenu: Item = {
    label: 'BATSS Studio',
    submenu: [
      about,
      checkForUpdates,
      separator,
      settings,
      separator,
      { role: 'services' },
      separator,
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      separator,
      { role: 'quit' }
    ]
  }

  const fileMenu: Item = {
    label: 'File',
    submenu: [
      command('new-design', 'New Design', MENU_SHORTCUTS['new-design']),
      command('open-design', 'Open…', MENU_SHORTCUTS['open-design']),
      openRecent,
      separator,
      command('save-design', 'Save', MENU_SHORTCUTS['save-design']),
      command('save-design-as', 'Save As…', MENU_SHORTCUTS['save-design-as']),
      command('show-design-in-folder', mac ? 'Show in Finder' : 'Show in Folder'),
      separator,
      ...(mac
        ? [{ role: 'close' } satisfies Item]
        : [settings, separator, { role: 'quit', label: 'Exit' } satisfies Item])
    ]
  }

  // Cut, copy and paste in text boxes go through these on macOS
  const editMenu: Item = { role: 'editMenu' }

  const viewMenu: Item = {
    label: 'View',
    submenu: [
      ...MENU_VIEWS.map((page): Item => ({
        label: page.label,
        enabled: state.hasDesign,
        ...('shortcut' in page && { accelerator: toAccelerator(page.shortcut) }),
        click: () => run({ type: 'navigate', view: page.view })
      })),
      separator,
      command('open-command-palette', 'Command Palette…', MENU_SHORTCUTS['open-command-palette']),
      separator,
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      separator,
      { role: 'togglefullscreen' },
      // Reload throws away unsaved work without asking, and the developer
      // tools are no place for users: development builds only
      ...(isDevelopment
        ? [
            separator,
            { role: 'reload' } satisfies Item,
            { role: 'forceReload' } satisfies Item,
            { role: 'toggleDevTools' } satisfies Item
          ]
        : [])
    ]
  }

  const helpMenu: Item = {
    role: 'help',
    submenu: [
      { label: 'Show Error Log', click: options.showErrorLog },
      { label: 'Report a Problem…', click: () => options.openUrl(ISSUES_URL) },
      { label: 'BATSS Documentation', click: () => options.openUrl(BATSS_DOCS_URL) },
      // On macOS these are in the BATSS Studio menu
      ...(mac ? [] : [separator, checkForUpdates, about])
    ]
  }

  return [
    ...(mac ? [appMenu] : []),
    fileMenu,
    editMenu,
    viewMenu,
    ...(mac ? [{ role: 'windowMenu' } satisfies Item] : []),
    helpMenu
  ]
}
