import { is } from '@electron-toolkit/utils'
import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'

import { matchesAppPage } from './app-page'

// Every IPC handler is registered through handle()/on() below, which only
// accept messages from the app's own page: the window's top-level frame,
// showing the bundled renderer (or the dev server in development). Anything
// else, such as an embedded frame or a page the window was somehow
// navigated to, is refused. (Electron security checklist: validate the
// sender of all IPC messages.)

// Same location index.ts loads the window from (out/renderer/index.html)
const RENDERER_FILE_URL = pathToFileURL(join(__dirname, '../renderer/index.html')).href

function isAppPage(url: string): boolean {
  const devUrl = is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined
  return matchesAppPage(url, RENDERER_FILE_URL, devUrl)
}

function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame
  return !!frame && frame.parent === null && isAppPage(frame.url)
}

/** ipcMain.handle, refusing requests that don't come from the app's own page. */
export function handle(
  channel: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => unknown // eslint-disable-line @typescript-eslint/no-explicit-any
): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      console.warn(`Refused IPC request on ${channel} from an untrusted sender`)
      throw new Error('Request refused')
    }
    return listener(event, ...args)
  })
}

/** ipcMain.on, ignoring messages that don't come from the app's own page. */
export function on(
  channel: string,
  listener: (event: IpcMainEvent, ...args: any[]) => void // eslint-disable-line @typescript-eslint/no-explicit-any
): void {
  ipcMain.on(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      console.warn(`Ignored IPC message on ${channel} from an untrusted sender`)
      return
    }
    listener(event, ...args)
  })
}
