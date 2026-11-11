import { randomUUID } from 'crypto'
import {
  BrowserWindow,
  dialog,
  type IpcMainInvokeEvent,
  type MessageBoxOptions,
  type OpenDialogOptions,
  type SaveDialogOptions,
  shell
} from 'electron'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { parseStudyDesignFile } from '../../shared/design-file-schema'
import type { EngineBusy } from '../../shared/engine-types'
import { IPC } from '../../shared/ipc-channels'
import type {
  RecentDesignItem,
  SaveResultResponse,
  StudyDesign
} from '../../shared/simulation-types'
import { getWorkspacePath } from '../services/filesystem/app-paths'
import {
  addRecentDesign,
  forgetRecentDesign,
  readRecentDesigns,
  type RecentDesign
} from '../services/recent-designs'
import { settingsService } from '../services/settings.service'
import { OUTPUT_PATH_KEY, RECENT_DESIGNS_KEY } from '../settings.constants'
import { handle, on } from './trusted-ipc'

const DESIGN_FILE_EXTENSION = 'design'

// Dialogs belong to the window that asked: a sheet attached to it on
// macOS, and kept in front of it on Windows, rather than a free-floating
// panel that can open behind it
type Owner = BrowserWindow | null

const ownerOf = (event: IpcMainInvokeEvent): Owner => BrowserWindow.fromWebContents(event.sender)

const showMessageBox = (
  owner: Owner,
  options: MessageBoxOptions
): ReturnType<typeof dialog.showMessageBox> =>
  owner ? dialog.showMessageBox(owner, options) : dialog.showMessageBox(options)

const showSaveDialog = (
  owner: Owner,
  options: SaveDialogOptions
): ReturnType<typeof dialog.showSaveDialog> =>
  owner ? dialog.showSaveDialog(owner, options) : dialog.showSaveDialog(options)

const showOpenDialog = (
  owner: Owner,
  options: OpenDialogOptions
): ReturnType<typeof dialog.showOpenDialog> =>
  owner ? dialog.showOpenDialog(owner, options) : dialog.showOpenDialog(options)

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

const recentDesigns = (): RecentDesign[] =>
  readRecentDesigns(settingsService.get<unknown>(RECENT_DESIGNS_KEY, []))

const storeRecentDesigns = (list: RecentDesign[]): void =>
  settingsService.set(RECENT_DESIGNS_KEY, list)

// Called after a design is opened or saved, so it's at the top of the
// list with its current name
function recordRecentDesign(filePath: string, design: StudyDesign): void {
  storeRecentDesigns(
    addRecentDesign(
      recentDesigns(),
      {
        path: filePath,
        name: design.name,
        description: design.description,
        openedAt: new Date().toISOString()
      },
      randomUUID
    )
  )
}

// ~/Trial designs rather than /home/me/Trial designs, except on Windows,
// where ~ isn't how people see their folders
function shownFolder(filePath: string): string {
  const folder = path.dirname(filePath)
  const home = os.homedir()
  if (process.platform === 'win32' || !folder.startsWith(home)) return folder
  return `~${folder.slice(home.length)}`
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Far above any real design (a run at R=10,000 is ~200 KB), so this only
// stops absurd data from being written or read into memory
const MAX_DESIGN_FILE_BYTES = 100 * 1024 * 1024

/**
 * The JSON to write for `data`, after checking it's a design BATSS Studio
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

async function saveViaDialog(
  owner: Owner,
  data: StudyDesign,
  text: string
): Promise<SaveResultResponse> {
  const designName = data.name || 'Untitled Design'
  const fileName = `${sanitizeFileName(designName)}.${DESIGN_FILE_EXTENSION}`

  const defaultPath = path.join(settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()), fileName)

  const { canceled, filePath } = await showSaveDialog(owner, {
    defaultPath,
    filters: [{ name: 'BATSS Studio Study Design', extensions: [DESIGN_FILE_EXTENSION] }]
  })

  if (canceled || !filePath) return { saved: false }

  await fs.writeFile(filePath, text, 'utf8')
  rememberChosenPath(filePath)
  recordRecentDesign(filePath, data)
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

export function registerDesignFilesIPC(): void {
  on(IPC.design.dirty, (_event, dirty: unknown) => {
    designHasUnsavedChanges = dirty === true
  })

  handle(IPC.design.canLeave, async (event) => {
    if (!designHasUnsavedChanges) {
      return true
    }

    const result = await showMessageBox(ownerOf(event), {
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

  handle(IPC.design.confirmStopRun, async (event, data: unknown) => {
    // Only two valid values; never put an unchecked value in dialog text
    const kind: Exclude<EngineBusy, 'idle'> = data === 'batch' ? 'batch' : 'simulation'

    const result = await showMessageBox(ownerOf(event), {
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
    async (event, data: unknown, knownPath?: unknown): Promise<SaveResultResponse> => {
      const { design, text } = designFileText(data)

      if (typeof knownPath !== 'string' || !userChosenPaths.has(path.resolve(knownPath))) {
        return saveViaDialog(ownerOf(event), design, text)
      }
      try {
        await fs.writeFile(knownPath, text, 'utf8')
        recordRecentDesign(knownPath, design)
        designHasUnsavedChanges = false
        return { saved: true, filePath: knownPath }
      } catch {
        // Remembered path is gone (moved/deleted outside the app) —
        // fall back to the picker instead of failing with no recovery.
        return saveViaDialog(ownerOf(event), design, text)
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

  handle(IPC.design.loadResult, async (event) => {
    const owner = ownerOf(event)
    const { canceled, filePaths } = await showOpenDialog(owner, {
      // Electron 43+ defaults to Downloads; start where designs are saved.
      defaultPath: settingsService.get(OUTPUT_PATH_KEY, getWorkspacePath()),
      filters: [
        {
          name: 'BATSS Studio Study Design',
          extensions: [DESIGN_FILE_EXTENSION]
        }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) return null

    return openDesignFile(owner, filePaths[0])
  })

  // The recent list, with which files are still where they were
  handle(IPC.design.recentList, async (): Promise<RecentDesignItem[]> =>
    Promise.all(
      recentDesigns().map(async (entry) => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        folder: shownFolder(entry.path),
        openedAt: entry.openedAt,
        found: await exists(entry.path)
      }))
    )
  )

  // Opens a design from the recent list. Only an id comes from the
  // window; the path is the one stored when the user opened or saved it
  handle(IPC.design.openRecent, async (event, id: unknown) => {
    const entry = recentDesigns().find((candidate) => candidate.id === id)
    if (!entry) return null
    return openDesignFile(ownerOf(event), entry.path)
  })

  handle(IPC.design.forgetRecent, async (_, id: unknown): Promise<void> => {
    if (typeof id === 'string') storeRecentDesigns(forgetRecentDesign(recentDesigns(), id))
  })

  handle(IPC.design.clearRecent, async (): Promise<void> => storeRecentDesigns([]))
}

/**
 * Reads and checks a design file, showing the reason in a dialog if it
 * can't be opened. Used by Open and by the recent list, so both give the
 * same messages. Opened files become ones Save may write back to.
 */
async function openDesignFile(
  owner: Owner,
  filePath: string
): Promise<{ design: StudyDesign; filePath: string } | null> {
  // Same dialog as the JSON and schema errors below, rather than a
  // rejection the renderer has nothing to show for (e.g. no permission)
  let text: string
  try {
    if ((await fs.stat(filePath)).size > MAX_DESIGN_FILE_BYTES) {
      await showMessageBox(owner, {
        type: 'error',
        title: 'Invalid Design File',
        message: 'This file could not be opened.',
        detail: 'It is far larger than any BATSS Studio design file.'
      })
      return null
    }
    text = await fs.readFile(filePath, 'utf8')
  } catch {
    await showMessageBox(owner, {
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
    await showMessageBox(owner, {
      type: 'error',
      title: 'Invalid Design File',
      message: 'This file could not be opened.',
      detail: 'The file is not valid JSON.'
    })

    return null
  }

  const validation = parseStudyDesignFile(parsed)

  if (!validation.success) {
    await showMessageBox(owner, {
      type: 'error',
      title: 'Invalid Design File',
      message: "This file doesn't match the expected BATSS Studio design format.",
      detail: validation.issues.slice(0, 5).join('\n')
    })

    return null
  }

  rememberChosenPath(filePath)
  recordRecentDesign(filePath, validation.data)
  return { design: validation.data, filePath }
}
