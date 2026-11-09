import { app } from 'electron'
import path from 'path'

export const APP_NAME = 'BATSS Studio'

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
