import { app, BrowserWindow, ipcMain } from 'electron'

import { IPC } from '../../shared/ipc-channels'

export function registerAppIPC(): void {
  ipcMain.handle(IPC.app.version, () => {
    return app.getVersion()
  })

  ipcMain.handle(IPC.app.reload, () => {
    const window = BrowserWindow.getFocusedWindow()

    if (window) {
      window.reload()
    }
  })

  ipcMain.handle(IPC.app.quit, () => {
    app.quit()
  })
}
