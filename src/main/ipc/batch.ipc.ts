// src/main/ipc/batch.ipc.ts
import { ipcMain } from 'electron'

import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { IPC } from '../../shared/ipc-channels'
import { batchService } from '../services/batch.service'
import { safeSend } from './safe-send'

export function registerBatchIPC(): void {
  ipcMain.handle(IPC.batch.run, async (event, inputs: BatchPreparedInput[]) => {
    const send = safeSend(event.sender)
    const sendUpdate = (update: BatchUpdate): void => send(IPC.batch.update, update)
    const sendRowDone = (entry: BatchRunEntry): void => send(IPC.batch.rowDone, entry)

    const sendLog = (line: string): void => send(IPC.batch.log, line)

    return await batchService.runBatch(inputs, sendUpdate, sendRowDone, sendLog)
  })

  ipcMain.handle(IPC.batch.cancel, () => {
    return batchService.cancel()
  })
}
