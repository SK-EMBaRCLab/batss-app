import { BrowserWindow } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { engineService } from '../services/engine.service'
import { handle } from './trusted-ipc'

export function registerEngineIPC(): void {
  handle(IPC.engine.get, () => engineService.get())

  // Global state → every window, same pattern as theme:updated.
  engineService.subscribe((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(IPC.engine.state, state)
      }
    }
  })
}
