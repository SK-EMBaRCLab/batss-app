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

  // macOS-only native "unsaved changes" affordance: a dot inside the
  // red traffic-light close button (NSWindow.documentEdited). No-op
  // on Windows/Linux — those rely on document.title's own "• " prefix
  // instead (see useDocumentTitle), since there's no window-chrome
  // equivalent there.
  ipcMain.on(IPC.app.setDocumentEdited, (event, edited: boolean) => {
    BrowserWindow.fromWebContents(event.sender)?.setDocumentEdited(edited)
  })
}
