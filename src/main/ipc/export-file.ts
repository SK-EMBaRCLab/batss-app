// Checks a request to save an exported file (a chart image, the batch
// template, a run's R script or report). Kept free of Electron imports so it can be tested on its
// own. Only the file types the app exports, with a plain name and a
// sensible size, get as far as the Save dialog.
import path from 'path'

// Each type's extensions for the Save dialog's filter: R scripts are
// usually .R, and some file pickers match the case
export const EXPORT_TYPES = {
  png: { name: 'PNG image', extensions: ['png'] },
  csv: { name: 'CSV file', extensions: ['csv'] },
  r: { name: 'R script', extensions: ['R', 'r'] },
  docx: { name: 'Word document', extensions: ['docx'] }
} as const

export type ExportExtension = keyof typeof EXPORT_TYPES

// Far above any chart image or template
export const MAX_EXPORT_BYTES = 50 * 1024 * 1024

// Characters a file name can't hold on Windows or macOS
const UNSAFE = /[\\/:*?"<>|\p{Cc}]+/gu

export type ExportRequest = { fileName: string; extension: ExportExtension; bytes: Uint8Array }

const isExportExtension = (extension: string): extension is ExportExtension =>
  Object.hasOwn(EXPORT_TYPES, extension)

/** The request, with its name cleaned up, or null if it can't be saved. */
export function checkExportRequest(fileName: unknown, bytes: unknown): ExportRequest | null {
  if (typeof fileName !== 'string' || !(bytes instanceof Uint8Array)) return null
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_EXPORT_BYTES) return null

  // Only a name: any folder in it is dropped, so it's a suggestion for
  // the Save dialog and nothing more
  const name = path.posix
    .basename(fileName.replace(/\\/g, '/'))
    .replace(UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const extension = path.extname(name).slice(1).toLowerCase()

  if (!isExportExtension(extension) || name.length <= extension.length + 1) return null
  return { fileName: name, extension, bytes }
}
