import { BrowserWindow } from 'electron'

import { checkBatchRunInput } from '../../shared/batch-input-schema'
import type { BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { IPC } from '../../shared/ipc-channels'
import { batchService } from '../services/batch.service'
import { alertBatchFinished } from '../services/run-alerts'
import { isUpdatingPackages, PACKAGES_UPDATING_MESSAGE } from './runtime-queue'
import { batchedLogSender, safeSend } from './safe-send'
import { handle } from './trusted-ipc'

export function registerBatchIPC(): void {
  handle(IPC.batch.run, async (event, data: unknown): Promise<BatchUpdate> => {
    // Every row is checked before any runs (see batch-input-schema.ts)
    const checked = checkBatchRunInput(data)
    const total = Array.isArray(data) ? data.length : 0
    if (!checked.success) {
      return { status: 'error', completed: 0, total, message: checked.message }
    }
    // The update is reinstalling packages these runs would load
    if (isUpdatingPackages()) {
      return { status: 'error', completed: 0, total, message: PACKAGES_UPDATING_MESSAGE }
    }
    const inputs = checked.rows

    const send = safeSend(event.sender)
    const log = batchedLogSender(send, IPC.batch.log)
    // Flush pending log lines first, so a row's last lines (e.g. its
    // "Results" stage marker) always arrive before the row-done/next-row
    // events; the batch store relies on that order
    const sendUpdate = (update: BatchUpdate): void => {
      log.flush()
      send(IPC.batch.update, update)
    }
    const sendRowDone = (entry: BatchRunEntry): void => {
      log.flush()
      send(IPC.batch.rowDone, entry)
    }

    const startedAt = Date.now()
    const final = await batchService.runBatch(inputs, sendUpdate, sendRowDone, log.push)
    log.flush()

    alertBatchFinished(BrowserWindow.fromWebContents(event.sender), final, Date.now() - startedAt)
    return final
  })

  handle(IPC.batch.cancel, () => {
    return batchService.cancel()
  })
}
