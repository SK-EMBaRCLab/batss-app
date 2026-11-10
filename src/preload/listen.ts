import { ipcRenderer } from 'electron'

/**
 * Calls `callback` with each message main sends on `channel`. Returns the
 * function that stops listening; callers must keep it and call it when
 * they're done (see stores/update.ts for why it mustn't be lost).
 */
export function listen<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return (): void => {
    ipcRenderer.removeListener(channel, listener)
  }
}

/**
 * Like listen(), for R's log. Main already sends lines in batches (see
 * batchedLogSender), so each batch is passed on whole: splitting it here
 * only for the renderer to batch the lines again cost a second timer.
 */
export function listenToLog(channel: string, callback: (lines: string[]) => void): () => void {
  return listen<string[]>(channel, callback)
}
