import { app, BrowserWindow, ipcMain } from 'electron'

export function registerAppIPC(): void {
  ipcMain.removeHandler('app:version')
  ipcMain.removeHandler('app:reload')
  ipcMain.removeHandler('app:quit')

  ipcMain.handle('app:version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:reload', () => {
    const window = BrowserWindow.getFocusedWindow()

    if (window) {
      window.reload()
    }
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })
}
