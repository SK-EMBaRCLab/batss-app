import { app } from 'electron'
import { existsSync, renameSync } from 'fs'
import path from 'path'

import { recordError } from '../error-log.service'

export const APP_NAME = 'BATSS Studio'

/** The data folder's name before the app was renamed from Albatross. */
const LEGACY_DATA_FOLDER = 'albatross'

/**
 * Moves the old Albatross data folder (settings, R packages, error log)
 * to the BATSS Studio one, once: only if the old folder exists and the new
 * one doesn't, so every later launch is a no-op. It's a rename within the
 * same parent folder, so nothing is copied. If it fails (e.g. the old app
 * is still open on Windows), the error is logged and the app starts with a
 * fresh folder, leaving the old one untouched.
 *
 * Call after pinAppIdentity() and before anything uses the data folder.
 * Can be removed once nobody is upgrading from Albatross any more.
 */
export function migrateLegacyDataFolder(
  appData: string = app.getPath('appData')
): 'moved' | 'skipped' | 'failed' {
  const legacy = path.join(appData, LEGACY_DATA_FOLDER)
  const current = path.join(appData, APP_NAME)

  if (!existsSync(legacy) || existsSync(current)) {
    return 'skipped'
  }

  try {
    renameSync(legacy, current)
    return 'moved'
  } catch (error) {
    recordError('Moving the Albatross data folder', error)
    return 'failed'
  }
}

/**
 * Sets the app name and pins the data folder to `<appData>/BATSS Studio`.
 * Must run before the app is ready. Without it, Electron names the folder
 * after package.json (`batss-studio` in development, the product name when
 * packaged), so the two would use different folders.
 */
export function pinAppIdentity(): void {
  app.setName(APP_NAME)
  app.setPath('userData', path.join(app.getPath('appData'), APP_NAME))
}

export function getRLibraryPath(): string {
  return path.join(app.getPath('userData'), 'R-library')
}

export function getWorkspacePath(): string {
  return path.join(app.getPath('documents'), APP_NAME)
}

export function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}
