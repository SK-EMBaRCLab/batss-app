import { BrowserWindow, dialog, ipcMain } from 'electron'

import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import { OUTPUT_PATH_KEY } from '../settings.constants'

export function registerSettingsIPC(): void {
  ipcMain.removeHandler('settings:getOutputPath')
  ipcMain.removeHandler('settings:setOutputPath')
  ipcMain.removeHandler('settings:selectOutputDirectory')

  ipcMain.handle('settings:getOutputPath', () => {
    return settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath())
  })

  ipcMain.handle('settings:setOutputPath', (_event, outputPath: string) => {
    settingsService.set(OUTPUT_PATH_KEY, outputPath)

    return outputPath
  })

  ipcMain.handle('settings:selectOutputDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    const options: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory']
    }

    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })
}
