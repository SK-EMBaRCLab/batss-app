import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'
import { settingsService } from '../services/settings.service'
import path from 'path'
import { getWorkspacePath } from '../services/filesystem/app-paths'
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

export function registerAlbatrossFilesIPC(): void {
  ipcMain.removeHandler('albatross:saveResult')
  ipcMain.removeHandler('albatross:loadResult')

  ipcMain.handle('albatross:saveResult', async (_, data) => {
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

    return true
  })

  ipcMain.handle('albatross:loadResult', async () => {
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

    return JSON.parse(text)
  })
}
