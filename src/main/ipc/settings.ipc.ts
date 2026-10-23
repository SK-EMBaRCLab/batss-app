import { BrowserWindow, dialog, ipcMain } from 'electron'
import { existsSync, statSync } from 'fs'
import path from 'path'

import { IPC } from '../../shared/ipc-channels'
import type { SetOutputPathResult, SetSimulationTimeoutResult } from '../../shared/settings-types'
import {
  DEFAULT_SIMULATION_TIMEOUT_MINUTES,
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES
} from '../../shared/settings-types'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import {
  NOTIFY_ON_RUN_FINISH_KEY,
  OUTPUT_PATH_KEY,
  SIMULATION_TIMEOUT_MINUTES_KEY
} from '../settings.constants'

export function registerSettingsIPC(): void {
  ipcMain.handle(IPC.settings.getOutputPath, () => {
    return settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath())
  })

  ipcMain.handle(IPC.settings.setOutputPath, (_event, outputPath: unknown): SetOutputPathResult => {
    const trimmed = typeof outputPath === 'string' ? outputPath.trim() : ''

    if (!trimmed) {
      return { saved: false, error: 'Enter a folder path.' }
    }

    // A relative path would depend on whatever folder the app started in
    if (!path.isAbsolute(trimmed)) {
      return { saved: false, error: 'Enter a full folder path.' }
    }

    if (!existsSync(trimmed)) {
      return { saved: false, error: 'This folder does not exist.' }
    }

    if (!statSync(trimmed).isDirectory()) {
      return { saved: false, error: 'This path is a file, not a folder.' }
    }

    settingsService.set(OUTPUT_PATH_KEY, path.resolve(trimmed))

    return { saved: true }
  })

  ipcMain.handle(IPC.settings.getSimulationTimeoutMinutes, () => {
    return settingsService.get(SIMULATION_TIMEOUT_MINUTES_KEY, DEFAULT_SIMULATION_TIMEOUT_MINUTES)
  })

  ipcMain.handle(
    IPC.settings.setSimulationTimeoutMinutes,
    (_event, minutes: number): SetSimulationTimeoutResult => {
      if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) {
        return { saved: false, error: 'Enter a whole number of minutes.' }
      }

      if (minutes < MIN_SIMULATION_TIMEOUT_MINUTES || minutes > MAX_SIMULATION_TIMEOUT_MINUTES) {
        return {
          saved: false,
          error: `Enter a value between ${MIN_SIMULATION_TIMEOUT_MINUTES} and ${MAX_SIMULATION_TIMEOUT_MINUTES} minutes.`
        }
      }

      settingsService.set(SIMULATION_TIMEOUT_MINUTES_KEY, minutes)

      return { saved: true }
    }
  )

  ipcMain.handle(IPC.settings.getNotifyOnRunFinish, () => {
    return settingsService.get(NOTIFY_ON_RUN_FINISH_KEY, true)
  })

  ipcMain.handle(IPC.settings.setNotifyOnRunFinish, (_event, enabled: boolean) => {
    settingsService.set(NOTIFY_ON_RUN_FINISH_KEY, enabled === true)
  })

  ipcMain.handle(IPC.settings.selectOutputDirectory, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    const options: Electron.OpenDialogOptions = {
      // Electron 43+ defaults to Downloads; start at the current folder.
      defaultPath: settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()),
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
