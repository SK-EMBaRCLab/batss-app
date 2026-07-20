import { app } from 'electron'
import path from 'path'

export function getRLibraryPath() {
  return path.join(app.getPath('userData'), 'R-library')
}

export function getWorkspacePath() {
  return path.join(app.getPath('documents'), 'Albatross')
}

export function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}
