// Saving a file the app made (a chart image, the batch template, a run's
// R script or report). The
// main process asks where, with the name filled in (see files.ipc.ts),
// rather than the browser's download, which can ignore the name.

/** Asks where to save `blob`, suggesting `fileName`. False if the user cancelled. */
export async function saveExport(fileName: string, blob: Blob): Promise<boolean> {
  return window.files.saveExport(fileName, new Uint8Array(await blob.arrayBuffer()))
}

// Characters a file name can't hold on Windows or macOS
const UNSAFE = /[\\/:*?"<>|\p{Cc}]+/gu

/**
 * A file name for something exported from a run, e.g.
 * "My trial – chart – 2026-11-10.png". The date is the run's, in the
 * user's own time zone. Two runs from the same day get the same name,
 * so the Save dialog asks before replacing one.
 */
export function runExportFileName(
  designName: string,
  what: string,
  createdAt: string,
  extension: string
): string {
  const name = designName.replace(UNSAFE, ' ').replace(/\s+/g, ' ').trim() || 'Design'
  const date = new Date(createdAt)
  const pad = (n: number): string => String(n).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${name} – ${what} – ${stamp}.${extension}`
}
