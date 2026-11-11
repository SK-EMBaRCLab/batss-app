// Installs the menu bar (see app-menu-template.ts) and keeps it current:
// the window reports which commands are available, the recent list comes
// from design-files.ipc.ts, and a picked item is sent to the window to
// carry out, so it does exactly what the same command does in the app.
import { app, type BrowserWindow, Menu, shell } from 'electron'

import {
  MENU_COMMAND_IDS,
  type MenuAction,
  type MenuCommandId,
  type MenuState
} from '../../shared/app-menu'
import { IPC } from '../../shared/ipc-channels'
import { showErrorLog } from '../ipc/app.ipc'
import {
  clearRecentDesigns,
  listRecentDesigns,
  onRecentDesignsChange
} from '../ipc/design-files.ipc'
import { on } from '../ipc/trusted-ipc'
import { appMenuTemplate } from './app-menu-template'

// Before the window first reports: nothing that needs a design
let state: MenuState = {
  hasDesign: false,
  enabled: Object.fromEntries(
    MENU_COMMAND_IDS.map((id) => [id, id === 'new-design' || id === 'open-design'])
  ) as Record<MenuCommandId, boolean>
}

// Only the fields the menu uses, as booleans, whatever the window sent
function readState(data: unknown): MenuState | null {
  if (typeof data !== 'object' || data === null) return null
  const { hasDesign, enabled } = data as Record<string, unknown>
  if (typeof enabled !== 'object' || enabled === null) return null
  const flags = enabled as Record<string, unknown>
  return {
    hasDesign: hasDesign === true,
    enabled: Object.fromEntries(MENU_COMMAND_IDS.map((id) => [id, flags[id] === true])) as Record<
      MenuCommandId,
      boolean
    >
  }
}

export function registerAppMenu(getWindow: () => BrowserWindow | null): void {
  const run = (action: MenuAction): void => {
    getWindow()?.webContents.send(IPC.app.menuAction, action)
  }

  const refresh = (): void => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate(
        appMenuTemplate({
          platform: process.platform,
          isDevelopment: !app.isPackaged,
          state,
          recent: listRecentDesigns(),
          run,
          clearRecent: clearRecentDesigns,
          showErrorLog: () => void showErrorLog(),
          openUrl: (url) => void shell.openExternal(url).catch(() => {})
        })
      )
    )
  }

  on(IPC.app.menuState, (_event, data: unknown) => {
    const next = readState(data)
    if (!next || JSON.stringify(next) === JSON.stringify(state)) return
    state = next
    refresh()
  })

  onRecentDesignsChange(refresh)
  refresh()
}
