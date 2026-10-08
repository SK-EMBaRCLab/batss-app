import { BrowserWindow, dialog, ipcMain } from 'electron'
import { existsSync, statSync } from 'fs'

import { IPC } from '../../shared/ipc-channels'
import type { SetOutputPathResult } from '../../shared/settings-types'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import { OUTPUT_PATH_KEY } from '../settings.constants'

export function registerSettingsIPC(): void {
  ipcMain.handle(IPC.settings.getOutputPath, () => {
    return settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath())
  })

  ipcMain.handle(IPC.settings.setOutputPath, (_event, outputPath: string): SetOutputPathResult => {
    const trimmed = outputPath.trim()

    if (!trimmed) {
      return { saved: false, error: 'Enter a folder path.' }
    }

    if (!existsSync(trimmed)) {
      return { saved: false, error: 'This folder does not exist.' }
    }

    if (!statSync(trimmed).isDirectory()) {
      return { saved: false, error: 'This path is a file, not a folder.' }
    }

    settingsService.set(OUTPUT_PATH_KEY, trimmed)

    return { saved: true }
  })

  ipcMain.handle(IPC.settings.selectOutputDirectory, async (event) => {
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
