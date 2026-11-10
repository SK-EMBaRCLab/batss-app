// Saving a file the app made (a chart image, the batch template). The
// renderer used to hand these to the browser's download, which picks its
// own name and place: with no Downloads folder (e.g. the Docker dev
// container) Chromium asked where to save with the name "download". Here
// the app asks itself, with the right name, the same on every system.
import { app, BrowserWindow, dialog, type SaveDialogOptions } from 'electron'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { IPC } from '../../shared/ipc-channels'
import { checkExportRequest, EXPORT_TYPES } from './export-file'
import { handle } from './trusted-ipc'

// Downloads, where people look for exports, or home where there's none
function startFolder(): string {
  const downloads = app.getPath('downloads')
  return existsSync(downloads) ? downloads : app.getPath('home')
}

export function registerFilesIPC(): void {
  handle(
    IPC.files.saveExport,
    async (event, fileName: unknown, bytes: unknown): Promise<boolean> => {
      const request = checkExportRequest(fileName, bytes)
      if (!request) throw new Error("This file can't be saved.")

      const options: SaveDialogOptions = {
        defaultPath: path.join(startFolder(), request.fileName),
        filters: [{ name: EXPORT_TYPES[request.extension].name, extensions: [request.extension] }]
      }
      // Attached to the window that asked (a sheet on macOS)
      const owner = BrowserWindow.fromWebContents(event.sender)
      const { canceled, filePath } = owner
        ? await dialog.showSaveDialog(owner, options)
        : await dialog.showSaveDialog(options)

      // Only ever written where the user chose in the dialog
      if (canceled || !filePath) return false
      await fs.writeFile(filePath, request.bytes)
      return true
    }
  )
}
