import { BrowserWindow, dialog } from 'electron'
import { existsSync, statSync } from 'fs'
import path from 'path'

import { IPC } from '../../shared/ipc-channels'
import type { SetOutputPathResult, SetSimulationTimeoutResult } from '../../shared/settings-types'
import {
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES,
  normaliseTimeoutMinutes
} from '../../shared/settings-types'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import {
  NOTIFY_ON_RUN_FINISH_KEY,
  OUTPUT_PATH_KEY,
  SIMULATION_TIMEOUT_MINUTES_KEY
} from '../settings.constants'
import { handle } from './trusted-ipc'

// The folder last picked in the Browse dialog (see setOutputPath)
let lastBrowsedDirectory: string | null = null

function isNetworkPath(value: string): boolean {
  return value.startsWith('\\\\') || value.startsWith('//')
}

export function registerSettingsIPC(): void {
  handle(IPC.settings.getOutputPath, () => {
    return settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath())
  })

  handle(IPC.settings.setOutputPath, (_event, outputPath: unknown): SetOutputPathResult => {
    const trimmed = typeof outputPath === 'string' ? outputPath.trim() : ''

    if (!trimmed) {
      return { saved: false, error: 'Enter a folder path.' }
    }

    // A relative path would depend on whatever folder the app started in
    if (!path.isAbsolute(trimmed)) {
      return { saved: false, error: 'Enter a full folder path.' }
    }

    // A Windows network path (\\server\share) is checked below by touching
    // it, which makes Windows sign in to that server and send a hash of the
    // user's password. Only allow one picked with Browse, never a typed or
    // renderer-supplied one.
    if (isNetworkPath(trimmed) && trimmed !== lastBrowsedDirectory) {
      return { saved: false, error: 'Choose network folders with Browse.' }
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

  handle(IPC.settings.getSimulationTimeoutMinutes, () => {
    return normaliseTimeoutMinutes(
      settingsService.get<unknown>(SIMULATION_TIMEOUT_MINUTES_KEY, undefined)
    )
  })

  handle(
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

  handle(IPC.settings.getNotifyOnRunFinish, () => {
    return settingsService.get(NOTIFY_ON_RUN_FINISH_KEY, true)
  })

  handle(IPC.settings.setNotifyOnRunFinish, (_event, enabled: boolean) => {
    settingsService.set(NOTIFY_ON_RUN_FINISH_KEY, enabled === true)
  })

  handle(IPC.settings.selectOutputDirectory, async (event) => {
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

    lastBrowsedDirectory = result.filePaths[0]
    return result.filePaths[0]
  })
}
