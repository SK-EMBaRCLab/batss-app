import { app, BrowserWindow, ipcMain } from 'electron'
import os from 'os'

import type { TaskbarProgressMode } from '../../shared/engine-types'
import { IPC } from '../../shared/ipc-channels'

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
}
