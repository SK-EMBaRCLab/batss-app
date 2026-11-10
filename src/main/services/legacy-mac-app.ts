// BATSS Studio was called Albatross before 6.0. On macOS an update is a
// .dmg dragged into Applications (see mac-update.ts), and the renamed app
// bundle (BATSS Studio.app) doesn't replace albatross.app, so both stay
// installed. There's no installer to remove the old one, so the app offers
// to move it to the Trash, once. Recoverable, and only with the user's say.
import { app, type BrowserWindow, dialog, shell } from 'electron'
import { existsSync, readFileSync } from 'fs'
import os from 'os'
import path from 'path'

import { LEGACY_MAC_APP_PROMPTED_KEY } from '../settings.constants'
import { recordError } from './error-log.service'
import { settingsService } from './settings.service'

const LEGACY_BUNDLE_ID = 'com.albatross.app'
const LEGACY_BUNDLE_NAME = 'albatross.app'

/**
 * Where an app dragged in from a .dmg ends up: the system or the user's
 * Applications. macOS paths, so always joined with / (also when the tests
 * run on Windows).
 */
export function legacyAppCandidates(home: string = os.homedir()): string[] {
  return [
    path.posix.join('/Applications', LEGACY_BUNDLE_NAME),
    path.posix.join(home, 'Applications', LEGACY_BUNDLE_NAME)
  ]
}

/** The bundle's identifier from its Info.plist (electron-builder writes XML), or null. */
export function bundleIdentifier(bundlePath: string): string | null {
  try {
    const plist = readFileSync(path.join(bundlePath, 'Contents', 'Info.plist'), 'utf8')
    const match = plist.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/**
 * The old Albatross bundle, if one is installed. Checked by identifier, not
 * just name, so an unrelated app called albatross.app is never touched.
 */
export function findLegacyApp(candidates: string[] = legacyAppCandidates()): string | null {
  return (
    candidates.find(
      (candidate) => existsSync(candidate) && bundleIdentifier(candidate) === LEGACY_BUNDLE_ID
    ) ?? null
  )
}

/** Asks once whether to move the old Albatross app to the Trash. macOS only. */
export async function offerToRemoveLegacyMacApp(parent: BrowserWindow): Promise<void> {
  if (process.platform !== 'darwin' || !app.isPackaged) return
  if (settingsService.get(LEGACY_MAC_APP_PROMPTED_KEY, false)) return

  const legacyApp = findLegacyApp()
  if (!legacyApp) return

  // Asked once, whatever the answer: Keep means keep
  settingsService.set(LEGACY_MAC_APP_PROMPTED_KEY, true)

  const { response } = await dialog.showMessageBox(parent, {
    type: 'question',
    message: 'The old Albatross app is still installed',
    detail:
      'BATSS Studio is the new name for Albatross, so the old app is no longer needed. ' +
      'Move it to the Trash? Your designs and settings are kept.',
    buttons: ['Move to Trash', 'Keep'],
    defaultId: 0,
    cancelId: 1
  })
  if (response !== 0) return

  try {
    await shell.trashItem(legacyApp)
  } catch (error) {
    recordError('Moving the old Albatross app to the Trash', error)
    await dialog.showMessageBox(parent, {
      type: 'warning',
      message: "Couldn't move Albatross to the Trash",
      detail: `You can remove it yourself: drag ${legacyApp} to the Trash.`
    })
  }
}
