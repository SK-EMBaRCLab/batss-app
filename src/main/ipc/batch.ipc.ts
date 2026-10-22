// src/main/ipc/batch.ipc.ts
import { BrowserWindow, ipcMain } from 'electron'

import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { IPC } from '../../shared/ipc-channels'
import { batchService } from '../services/batch.service'
import { alertBatchFinished } from '../services/run-alerts'
import { safeSend } from './safe-send'

export function registerBatchIPC(): void {
  ipcMain.handle(IPC.batch.run, async (event, inputs: BatchPreparedInput[]) => {
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
