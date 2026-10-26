import { BrowserWindow } from 'electron'

import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { IPC } from '../../shared/ipc-channels'
import { checkSimulationRunInput, MAX_BATCH_ROWS } from '../../shared/simulation-input-schema'
import { batchService } from '../services/batch.service'
import { alertBatchFinished } from '../services/run-alerts'
import { batchedLogSender, safeSend } from './safe-send'
import { handle } from './trusted-ipc'

export function registerBatchIPC(): void {
  handle(IPC.batch.run, async (event, data: unknown): Promise<BatchUpdate> => {
    // Check every row before starting, so one bad row doesn't stop the
    // batch partway through
    const rows = Array.isArray(data) ? (data as BatchPreparedInput[]) : []
    if (rows.length > MAX_BATCH_ROWS) {
      return {
        status: 'error',
        completed: 0,
        total: rows.length,
        message: `A batch can have at most ${MAX_BATCH_ROWS} rows; this one has ${rows.length}.`
      }
    }

    const inputs: BatchPreparedInput[] = []
    for (const [index, row] of rows.entries()) {
      // rowIndex is only used for display, but must be a real row number
      const rowIndex = Number.isInteger(row?.rowIndex) && row.rowIndex >= 0 ? row.rowIndex : index
      const checked = checkSimulationRunInput(row?.input)
      if (!checked.success) {
        return {
          status: 'error',
          completed: 0,
          total: rows.length,
          message: `Row ${rowIndex + 1}: ${checked.message}`
        }
      }
      inputs.push({ rowIndex, input: checked.input })
    }

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
