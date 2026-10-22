import { BrowserWindow, Notification } from 'electron'

import icon from '../../../resources/icon.png?asset'
import type { BatchUpdate } from '../../shared/batch-types'
import { formatDurationLabel } from '../../shared/duration'
import type { RunFinishedSummary } from '../../shared/engine-types'
import { IPC } from '../../shared/ipc-channels'
import type { SimulationRunResult } from '../../shared/simulation-types'
import { NOTIFY_ON_RUN_FINISH_KEY } from '../settings.constants'
import { settingsService } from './settings.service'

// Electron drops a Notification's click handler once it's garbage
// collected, so hold on to the latest one until it's replaced.
let current: Notification | null = null

/**
 * Lets the user know a run finished while albatross was in the
 * background: flashes the taskbar button / bounces the dock icon, and
 * (unless turned off in Settings) shows a native notification, which
 * plays the OS's own notification sound. Clicking it brings the window
 * back and tells the renderer which page to open. Does nothing while
 * the window is focused, since the in-app status is already visible.
 *
 * Fired from main rather than the renderer so it still works if the
 * renderer reloads mid-run.
 */
function alertRunFinished(
  window: BrowserWindow,
  summary: RunFinishedSummary,
  title: string,
  body: string
): void {
  if (window.isDestroyed() || window.isFocused()) return

  window.flashFrame(true)
  window.once('focus', () => window.flashFrame(false))

  if (!settingsService.get(NOTIFY_ON_RUN_FINISH_KEY, true) || !Notification.isSupported()) {
    return
  }

  current?.close()

  const notification = new Notification({ title, body, icon })

  notification.on('click', () => {
    if (window.isDestroyed()) return

    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
    window.webContents.send(IPC.app.openRunResult, summary)
  })

  notification.show()
  current = notification
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
