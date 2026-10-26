import { autoUpdater } from 'electron-updater'

import { withReference } from '../../shared/error-reference'
import type { UpdateState } from '../../shared/update-types'
import { recordError } from './error-log.service'

type Listener = (state: UpdateState) => void

/**
 * Wraps electron-updater. A silent check runs once automatically on
 * launch (see check(true) in the renderer's update store) so users
 * learn about new releases without visiting Settings — if it finds
 * one, the banner offers it. Nothing is downloaded until the user
 * clicks Download: releases aren't code-signed yet, so the only check
 * on a download is a hash published in the same GitHub release.
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

  // Which step a failure belongs to, for its message
  private phase: 'check' | 'download' = 'check'

  init(): void {
    if (this.initialized) return
    this.initialized = true

    // Until releases are code-signed, an update is only as trustworthy
    // as the GitHub release it came from, so download only on request
    autoUpdater.autoDownload = false

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
        message: `Update ${info.version} available`,
        version: info.version,
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

    autoUpdater.on('error', (err) => this.fail(err, this.silentCheck))
  }

  get(): UpdateState {
    return this.state
  }

  async check(silent = false): Promise<void> {
    this.silentCheck = silent
    this.phase = 'check'
    // Clear any earlier error up front, so a failure before the updater's
    // own 'checking-for-update' event is still recorded (see fail())
    this.set({ status: 'checking', message: 'Checking for updates…', silent })

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      // Belt-and-suspenders: checkForUpdates() rejecting is usually
      // also reported via the 'error' event above, but config-level
      // failures (e.g. no publish config) can reject without one.
      this.fail(error, silent)
    }
  }

  async download(): Promise<void> {
    if (this.state.status !== 'available') return

    this.phase = 'download'
    this.set({
      status: 'downloading',
      message: 'Downloading update… 0%',
      version: this.state.version,
      progress: 0,
      silent: false
    })

    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      // Usually also reported via the 'error' event; this covers the rest
      this.fail(error, false)
    }
  }

  install(): void {
    autoUpdater.quitAndInstall(true, true)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // The updater's raw errors can include URLs, HTTP status and server
  // responses, so users get a generic message with a reference and the
  // details go to the error log. A failure is often reported both by the
  // 'error' event and by the rejected call; only the first is recorded.
  private fail(error: unknown, silent: boolean): void {
    if (this.state.status === 'error') return

    const downloading = this.phase === 'download'
    const reference = recordError(downloading ? 'update download' : 'update check', error)

    this.set({
      status: 'error',
      message: downloading ? "Couldn't download the update" : "Couldn't check for updates",
      error: withReference('You can download the latest version from GitHub instead.', reference),
      silent
    })
  }

  private set(state: UpdateState): void {
    this.state = state
    for (const listener of this.listeners) listener(state)
  }
}

export const updateService = new UpdateService()
