import { dialog, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'

import { parseStudyDesignFile } from '../../shared/design-file-schema'
import { IPC } from '../../shared/ipc-channels'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import { OUTPUT_PATH_KEY } from '../settings.constants'

const DESIGN_FILE_EXTENSION = 'design'

function sanitizeFileName(name: string): string {
  const withoutControlChars = Array.from(name)
    .filter((char) => char.codePointAt(0)! > 0x1f)
    .join('')

  const cleaned = withoutControlChars
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')

  return cleaned.length > 0 ? cleaned : 'Untitled Design'
}

let designHasUnsavedChanges = false

export function hasUnsavedDesignChanges(): boolean {
  return designHasUnsavedChanges
}

export function clearUnsavedDesignChanges(): void {
  designHasUnsavedChanges = false
}

export function registerAlbatrossFilesIPC(): void {
  ipcMain.on(IPC.design.dirty, (_event, dirty: boolean) => {
    designHasUnsavedChanges = dirty
  })

  ipcMain.handle(IPC.design.canLeave, async () => {
    if (!designHasUnsavedChanges) {
      return true
    }

    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Unsaved Design',
      message: 'Your design has unsaved changes.',
      detail: 'Do you want to save before continuing?',
      buttons: ['Save', 'Discard', 'Cancel'],
      cancelId: 2
    })

    switch (result.response) {
      case 0:
        return 'save'

      case 1:
        designHasUnsavedChanges = false
        return true

      default:
        return false
    }
  })

  ipcMain.handle(IPC.design.saveResult, async (_, data) => {
    const designName = typeof data?.name === 'string' ? data.name : 'Untitled Design'
    const fileName = `${sanitizeFileName(designName)}.${DESIGN_FILE_EXTENSION}`

    const defaultPath = path.join(
      settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()),
      fileName
    )
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        {
          name: 'Albatross Study Design',
          extensions: [DESIGN_FILE_EXTENSION]
        }
      ]
    })

    if (canceled || !filePath) return false

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')

    designHasUnsavedChanges = false

    return true
  })

  ipcMain.handle(IPC.design.loadResult, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [
        {
          name: 'Albatross Study Design',
          extensions: [DESIGN_FILE_EXTENSION]
        }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) return null

    const text = await fs.readFile(filePaths[0], 'utf8')

    let parsed: unknown

    try {
      parsed = JSON.parse(text)
    } catch {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Design File',
        message: 'This file could not be opened.',
        detail: 'The file is not valid JSON.'
      })

      return null
    }

    const validation = parseStudyDesignFile(parsed)

    if (!validation.success) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Design File',
        message: "This file doesn't match the expected Albatross design format.",
        detail: validation.issues.slice(0, 5).join('\n')
      })

      return null
    }

    return validation.data
  })
}
