import { autoUpdater } from 'electron-updater'

import type { UpdateState } from '../../shared/update-types'

type Listener = (state: UpdateState) => void

/**
 * Wraps electron-updater. A silent check runs once automatically on
 * launch (see check(true) in the renderer's update store) so users
 * learn about new releases without visiting Settings — if it finds
 * one, the normal banner/download/"Restart & Install" flow takes over.
 * Launch checks stay quiet when there's nothing to report (no "up to
 * date" toast, no error banner); only an explicit, user-triggered
 * check surfaces those. Installing always requires the user to click
 * "Restart & Install".
 *
 * Platform notes (see also the README's packaging section):
 *  - Windows (NSIS): fully supported — differential download + silent
 *    install via quitAndInstall.
 *  - macOS: releases are ad hoc signed, not notarized (see
 *    electron-builder.yml). Squirrel.Mac can still download and apply
 *    updates, but on some macOS versions/Gatekeeper configurations the
 *    signature check on the downloaded update can fail. That surfaces
 *    here as a normal 'error' state — same as any other failure — and
 *    the renderer always offers a "View releases on GitHub" fallback
 *    so a user is never stuck with no path to update.
 *  - Linux: electron-updater only knows how to self-update the
 *    AppImage target. .deb/.snap installs (also built — see
 *    electron-builder.yml) are managed by the OS package
 *    manager/snapd instead; checkForUpdates() will error out for
 *    those, which — again — just surfaces as a normal error state with
 *    the GitHub releases fallback. The AppImage restart itself always
 *    relaunches with an empty argv (see AppImageUpdater.doInstall in
 *    electron-updater), which drops the `--ozone-platform=x11` flag
 *    some Wayland setups need — see the self-relaunch guard in
 *    src/main/index.ts, which re-adds it on every launch including
 *    this one.
 */
class UpdateService {
  private state: UpdateState = { status: 'idle', message: '' }
  private readonly listeners = new Set<Listener>()
  private initialized = false

  // Tracks whether the in-flight check was the automatic launch check
  // or a user clicking a "Check for Updates" button, so every event it
  // produces (checking → available/not-available → ... ) can carry the
  // same silent flag through to the renderer.
  private silentCheck = false

  init(): void {
    if (this.initialized) return
    this.initialized = true

    autoUpdater.autoDownload = true

    // Only ever install when the user explicitly confirms via the
    // "Restart & Install" action — never silently on quit.
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('checking-for-update', () => {
      this.set({
        status: 'checking',
        message: 'Checking for updates…',
        silent: this.silentCheck
      })
    })

    autoUpdater.on('update-available', (info) => {
      this.set({
        status: 'available',
        message: `Update ${info.version} found — downloading…`,
        version: info.version,
        progress: 0,
        silent: this.silentCheck
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.set({
        status: 'not-available',
        message: "You're up to date.",
        silent: this.silentCheck
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      this.set({
        status: 'downloading',
        message: `Downloading update… ${Math.round(progress.percent)}%`,
        version: this.state.version,
        progress: progress.percent,
        silent: this.silentCheck
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.set({
        status: 'downloaded',
        message: `Update ${info.version} ready to install`,
        version: info.version,
        progress: 100,
        silent: this.silentCheck
      })
    })

    autoUpdater.on('error', (err) => {
      this.set({
        status: 'error',
        message: 'Update check failed',
        error: err instanceof Error ? err.message : String(err),
        silent: this.silentCheck
      })
    })
  }

  get(): UpdateState {
    return this.state
  }

  async check(silent = false): Promise<void> {
    this.silentCheck = silent

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      // Belt-and-suspenders: checkForUpdates() rejecting is usually
      // also reported via the 'error' event above, but config-level
      // failures (e.g. no publish config) can reject without one.
      this.set({
        status: 'error',
        message: 'Update check failed',
        error: error instanceof Error ? error.message : String(error),
        silent
      })
    }
  }

  install(): void {
    autoUpdater.quitAndInstall(true, true)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private set(state: UpdateState): void {
    this.state = state
    for (const listener of this.listeners) listener(state)
  }
}

export const updateService = new UpdateService()
