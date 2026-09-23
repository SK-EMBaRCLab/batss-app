// src/main/ipc/theme.ipc.ts
import { BrowserWindow, ipcMain, nativeTheme } from 'electron'

import { IPC } from '../../shared/ipc-channels'

type ThemeSource = 'system' | 'light' | 'dark'

function currentTheme(): { source: ThemeSource; dark: boolean } {
  return {
    source: nativeTheme.themeSource,
    dark: nativeTheme.shouldUseDarkColors
  }
}

export function registerThemeIPC(): void {
  ipcMain.handle(IPC.theme.get, () => currentTheme())

  ipcMain.handle(IPC.theme.set, (_event, theme: ThemeSource) => {
    nativeTheme.themeSource = theme
    return currentTheme()
  })

  // Global broadcast — OS-level theme changes fire this too, not just
  // our own theme:set calls, so every window needs to hear it.
  nativeTheme.on('updated', () => {
    const payload = currentTheme()

    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(IPC.theme.updated, payload)
      }
    }
  })
}
