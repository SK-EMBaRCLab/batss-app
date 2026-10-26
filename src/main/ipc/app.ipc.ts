import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import os from 'os'
import path from 'path'

import type { TaskbarProgressMode } from '../../shared/engine-types'
import { ERROR_REFERENCE_PATTERN } from '../../shared/error-reference'
import { IPC } from '../../shared/ipc-channels'
import { getErrorLogPath, recordError } from '../services/error-log.service'

const PROGRESS_MODES: readonly TaskbarProgressMode[] = ['normal', 'indeterminate', 'error']

export function registerAppIPC(): void {
  ipcMain.handle(IPC.app.version, () => {
    return app.getVersion()
  })

  // Lets the renderer show real core counts next to the "% of cores"
  // advanced-settings slider (e.g. "75% — 6 of 8 cores") instead of an
  // abstract percentage. os.cpus() is Node-only, hence the round trip.
  ipcMain.handle(IPC.app.cpuCount, () => {
    return os.cpus().length
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

  // Taskbar (Windows) / dock (macOS) progress for a running simulation
  // or batch. The renderer computes the value (see useTaskbarProgress),
  // since it owns the stage-based estimate. On Linux this only shows on
  // docks with Unity launcher support, and only with an installed
  // .desktop file, so not for the AppImage.
  ipcMain.on(IPC.app.setProgress, (event, value: unknown, mode: unknown) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return
    if (!PROGRESS_MODES.includes(mode as TaskbarProgressMode)) return
    BrowserWindow.fromWebContents(event.sender)?.setProgressBar(value, {
      mode: mode as TaskbarProgressMode
    })
  })

  // Unexpected errors caught in the renderer, recorded in the same error
  // log as main's own under the reference the user was shown
  ipcMain.on(
    IPC.app.recordError,
    (_event, reference: unknown, context: unknown, details: unknown) => {
      if (typeof reference !== 'string' || !ERROR_REFERENCE_PATTERN.test(reference)) return
      recordError(
        typeof context === 'string' ? context : 'renderer',
        typeof details === 'string' ? details : String(details),
        reference
      )
    }
  )

  // For Settings > Error Log: where the log lives, and opening the file
  // manager at it (or at its folder, if nothing has been logged yet).
  // Resolves to whether a log file exists.
  ipcMain.handle(IPC.app.errorLogPath, () => getErrorLogPath())

  ipcMain.handle(IPC.app.showErrorLog, async (): Promise<boolean> => {
    const file = getErrorLogPath()
    if (existsSync(file)) {
      shell.showItemInFolder(file)
      return true
    }

    mkdirSync(path.dirname(file), { recursive: true })
    const openError = await shell.openPath(path.dirname(file))
    if (openError) console.error('Could not open the error log folder:', openError)
    return false
  })
}
