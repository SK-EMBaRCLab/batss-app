import { BrowserWindow, Notification } from 'electron'

import icon from '../../../resources/icon.png?asset'
import type { BatchUpdate } from '../../shared/batch-types'
import { formatDurationLabel } from '../../shared/duration'
import type { RunFinishedSummary } from '../../shared/engine-types'
import { IPC } from '../../shared/ipc-channels'
import type { SimulationRunResult } from '../../shared/simulation-types'
import { NOTIFY_ON_RUN_FINISH_KEY } from '../settings.constants'
import { settingsService } from './settings.service'

// Windows already waiting for focus to stop flashing
const flashing = new WeakSet<BrowserWindow>()

// Electron drops a Notification's click handler once it's garbage
// collected, so hold on to the latest one until it's replaced.
let current: Notification | null = null

/**
 * Shows a native notification when a run finishes, unless disabled in
 * Settings. Background windows also flash/bounce for attention.
 * Clicking the notification opens the results or error page.
 * Runs in main so renderer reloads do not interrupt completion alerts.
 */
function alertRunFinished(
  window: BrowserWindow,
  summary: RunFinishedSummary,
  title: string,
  body: string
): void {
  if (window.isDestroyed()) return

  if (!window.isFocused()) {
    window.flashFrame(true)
    // One stop-flashing listener per window, not one per finished run
    if (!flashing.has(window)) {
      flashing.add(window)
      window.once('focus', () => {
        flashing.delete(window)
        window.flashFrame(false)
      })
    }
  }

  if (!settingsService.get(NOTIFY_ON_RUN_FINISH_KEY, true)) return

  if (!Notification.isSupported()) {
    console.warn('[run-alerts] Native notifications are not supported in this environment.')
    return
  }

  current?.close()

  const notification = new Notification({ title, body, icon, silent: false })

  notification.on('click', () => {
    if (window.isDestroyed()) return

    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
    window.webContents.send(IPC.app.openRunResult, summary)
  })

  notification.on('failed', (_event, error) => {
    console.warn(
      '[run-alerts] Could not deliver the completion notification. Check macOS notification permissions and app signing.',
      error
    )
  })

  notification.on('close', () => {
    if (current === notification) current = null
  })

  current = notification
  notification.show()
}

export function alertSimulationFinished(
  window: BrowserWindow | null,
  result: SimulationRunResult
): void {
  if (!window || result.status === 'cancelled') return

  if (result.status === 'success') {
    const took =
      result.durationMs != null ? `Took ${formatDurationLabel(result.durationMs / 1000)}. ` : ''

    alertRunFinished(
      window,
      { kind: 'simulation', outcome: 'success' },
      'Simulation complete',
      `${took}Click to view the results.`
    )
    return
  }

  alertRunFinished(
    window,
    { kind: 'simulation', outcome: 'error' },
    'Simulation failed',
    'Open Albatross to see what went wrong.'
  )
}

export function alertBatchFinished(
  window: BrowserWindow | null,
  final: BatchUpdate,
  durationMs: number
): void {
  if (!window) return

  const runs = `${final.completed} of ${final.total} runs finished`

  if (final.status === 'done') {
    alertRunFinished(
      window,
      { kind: 'batch', outcome: 'success' },
      'Batch complete',
      `${runs} in ${formatDurationLabel(durationMs / 1000)}.`
    )
  } else if (final.status === 'error') {
    alertRunFinished(
      window,
      { kind: 'batch', outcome: 'error' },
      'Batch stopped',
      `${runs}. Open Albatross for details.`
    )
  }
}
