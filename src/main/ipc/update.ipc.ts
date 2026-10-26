import { BrowserWindow } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { updateService } from '../services/update.service'
import { handle } from './trusted-ipc'

export function registerUpdateIPC(): void {
  updateService.init()

  handle(IPC.update.get, () => updateService.get())

  handle(IPC.update.check, (_event, silent?: boolean) => updateService.check(silent))

  handle(IPC.update.download, () => updateService.download())

  handle(IPC.update.install, () => updateService.install())

  // Global state → every window, same pattern as engine:state.
  updateService.subscribe((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(IPC.update.status, state)
      }
    }
  })
}
