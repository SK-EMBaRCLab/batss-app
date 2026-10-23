// src/main/ipc/batch.ipc.ts
import { BrowserWindow, ipcMain } from 'electron'

import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { IPC } from '../../shared/ipc-channels'
import { checkSimulationRunInput, MAX_BATCH_ROWS } from '../../shared/simulation-input-schema'
import { batchService } from '../services/batch.service'
import { alertBatchFinished } from '../services/run-alerts'
import { safeSend } from './safe-send'

export function registerBatchIPC(): void {
  ipcMain.handle(IPC.batch.run, async (event, data: unknown): Promise<BatchUpdate> => {
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
    const sendUpdate = (update: BatchUpdate): void => send(IPC.batch.update, update)
    const sendRowDone = (entry: BatchRunEntry): void => send(IPC.batch.rowDone, entry)

    const sendLog = (line: string): void => send(IPC.batch.log, line)

    const startedAt = Date.now()
    const final = await batchService.runBatch(inputs, sendUpdate, sendRowDone, sendLog)

    alertBatchFinished(BrowserWindow.fromWebContents(event.sender), final, Date.now() - startedAt)
    return final
  })

  ipcMain.handle(IPC.batch.cancel, () => {
    return batchService.cancel()
  })
}
