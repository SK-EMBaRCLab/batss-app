import { dialog, shell } from 'electron'
import fs from 'fs/promises'
import path from 'path'

import { parseStudyDesignFile } from '../../shared/design-file-schema'
import type { EngineBusy } from '../../shared/engine-types'
import { IPC } from '../../shared/ipc-channels'
import type { SaveResultResponse, StudyDesign } from '../../shared/simulation-types'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import { settingsService } from '../services/settings.service'
import { OUTPUT_PATH_KEY } from '../settings.constants'
import { handle, on } from './trusted-ipc'

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

// Paths the user picked in an Open or Save dialog this session. Save only
// writes straight to one of these: any other path the renderer sends goes
// through the Save dialog instead, so the renderer can never make main
// overwrite an arbitrary file.
const userChosenPaths = new Set<string>()

function rememberChosenPath(filePath: string): void {
  userChosenPaths.add(path.resolve(filePath))
}

// Far above any real design (a run at R=10,000 is ~200 KB), so this only
// stops absurd data from being written or read into memory
const MAX_DESIGN_FILE_BYTES = 100 * 1024 * 1024

/**
 * The JSON to write for `data`, after checking it's a design Albatross
 * could open again. Throws otherwise; the renderer shows a generic "Could
 * not save" message. The original data is written, not the checked copy,
 * which would silently drop any field the file schema doesn't list.
 */
function designFileText(data: unknown): { design: StudyDesign; text: string } {
  const checked = parseStudyDesignFile(data)
  if (!checked.success) {
    throw new Error(`Refusing to save an invalid design: ${checked.issues.slice(0, 3).join('; ')}`)
  }

  const text = JSON.stringify(data, null, 2)
  if (Buffer.byteLength(text, 'utf8') > MAX_DESIGN_FILE_BYTES) {
    throw new Error('Refusing to save a design over the size limit')
  }

  return { design: checked.data, text }
}

async function saveViaDialog(data: StudyDesign, text: string): Promise<SaveResultResponse> {
  const designName = data.name || 'Untitled Design'
  const fileName = `${sanitizeFileName(designName)}.${DESIGN_FILE_EXTENSION}`

  const defaultPath = path.join(settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()), fileName)

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: 'Albatross Study Design', extensions: [DESIGN_FILE_EXTENSION] }]
  })

  if (canceled || !filePath) return { saved: false }

  await fs.writeFile(filePath, text, 'utf8')
  rememberChosenPath(filePath)
  designHasUnsavedChanges = false
  return { saved: true, filePath }
}

let designHasUnsavedChanges = false

export function hasUnsavedDesignChanges(): boolean {
  return designHasUnsavedChanges
}

export function clearUnsavedDesignChanges(): void {
  designHasUnsavedChanges = false
}

export function registerAlbatrossFilesIPC(): void {
  on(IPC.design.dirty, (_event, dirty: unknown) => {
    designHasUnsavedChanges = dirty === true
  })

  handle(IPC.design.canLeave, async () => {
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

  handle(IPC.design.confirmStopRun, async (_, data: unknown) => {
    // Only two valid values; never put an unchecked value in dialog text
    const kind: Exclude<EngineBusy, 'idle'> = data === 'batch' ? 'batch' : 'simulation'

    const result = await dialog.showMessageBox({
      type: 'warning',
      title: kind === 'batch' ? 'Batch Running' : 'Simulation Running',
      message: `A ${kind} is still running.`,
      detail:
        kind === 'batch'
          ? 'Stop it to continue? Rows that have already finished stay in the current design.'
          : 'Stop it to continue? The run will be discarded.',
      buttons: [kind === 'batch' ? 'Stop Batch' : 'Stop Simulation', 'Keep Running'],
      defaultId: 1,
      cancelId: 1
    })

    return result.response === 0
  })

  handle(
    IPC.design.saveResult,
    async (_, data: unknown, knownPath?: unknown): Promise<SaveResultResponse> => {
      const { design, text } = designFileText(data)

      if (typeof knownPath !== 'string' || !userChosenPaths.has(path.resolve(knownPath))) {
        return saveViaDialog(design, text)
      }
      try {
        await fs.writeFile(knownPath, text, 'utf8')
        designHasUnsavedChanges = false
        return { saved: true, filePath: knownPath }
      } catch {
        // Remembered path is gone (moved/deleted outside the app) —
        // fall back to the picker instead of failing with no recovery.
        return saveViaDialog(design, text)
      }
    }
  )

  // Opens the file manager with the design file selected. Only for paths
  // the user chose in a dialog (see userChosenPaths). False if the file is
  // gone, so the renderer can say so.
  handle(IPC.design.showInFolder, async (_, filePath: unknown): Promise<boolean> => {
    if (typeof filePath !== 'string') return false

    const resolved = path.resolve(filePath)
    if (!userChosenPaths.has(resolved)) return false

    try {
      await fs.access(resolved)
    } catch {
      return false
    }

    shell.showItemInFolder(resolved)
    return true
  })

  handle(IPC.design.loadResult, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      // Electron 43+ defaults to Downloads; start where designs are saved.
      defaultPath: settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()),
      filters: [
        {
          name: 'Albatross Study Design',
          extensions: [DESIGN_FILE_EXTENSION]
        }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) return null

    const filePath = filePaths[0]

    // Same dialog as the JSON and schema errors below, rather than a
    // rejection the renderer has nothing to show for (e.g. no permission)
    let text: string
    try {
      if ((await fs.stat(filePath)).size > MAX_DESIGN_FILE_BYTES) {
        await dialog.showMessageBox({
          type: 'error',
          title: 'Invalid Design File',
          message: 'This file could not be opened.',
          detail: 'It is far larger than any Albatross design file.'
        })
        return null
      }
      text = await fs.readFile(filePath, 'utf8')
    } catch {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Design File',
        message: 'This file could not be opened.',
        detail: 'The file could not be read. Check that it still exists and that you can open it.'
      })

      return null
    }

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

    rememberChosenPath(filePath)
    return { design: validation.data, filePath }
  })
}
