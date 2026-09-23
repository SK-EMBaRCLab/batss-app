// src/main/ipc/safe-send.ts
export function safeSend(sender: Electron.WebContents) {
  return (channel: string, payload?: unknown): void => {
    if (!sender.isDestroyed()) sender.send(channel, payload)
  }
}
