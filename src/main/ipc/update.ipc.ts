import { BrowserWindow, ipcMain } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { updateService } from '../services/update.service'

export function registerUpdateIPC(): void {
  updateService.init()

  ipcMain.handle(IPC.update.get, () => updateService.get())

  ipcMain.handle(IPC.update.check, () => updateService.check())

  ipcMain.handle(IPC.update.install, () => updateService.install())

  // Global state → every window, same pattern as engine:state.
  updateService.subscribe((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(IPC.update.status, state)
      }
    }
  })
}
