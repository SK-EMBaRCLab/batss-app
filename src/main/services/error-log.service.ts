import { app } from 'electron'
import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'fs'
import path from 'path'

import { createErrorReference } from '../../shared/error-reference'

// Keeps the log small: once past this size, the older half is dropped
const MAX_LOG_BYTES = 256 * 1024
// One entry can't fill the log by itself (e.g. a huge R error)
const MAX_FIELD_CHARS = 8 * 1024

/** userData/logs/errors.log: stays on this computer, one JSON line per error. */
export function getErrorLogPath(): string {
  return path.join(app.getPath('userData'), 'logs', 'errors.log')
}

function truncate(text: string): string {
  return text.length > MAX_FIELD_CHARS ? `${text.slice(0, MAX_FIELD_CHARS)}… (truncated)` : text
}

function trimIfLarge(file: string): void {
  if (statSync(file).size <= MAX_LOG_BYTES) return

  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, lines.slice(Math.floor(lines.length / 2)).join('\n') + '\n')
  renameSync(tmp, file)
}

/**
 * Records an unexpected error's full details under `reference` (a new one
 * if omitted) and returns the reference to show the user alongside a
 * generic message. Never throws: failing to log mustn't become a second
 * error.
 */
export function recordError(
  context: string,
  error: unknown,
  reference: string = createErrorReference()
): string {
  const details =
    error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)

  console.error(`[${reference}] ${context}:`, error)

  try {
    const file = getErrorLogPath()
    mkdirSync(path.dirname(file), { recursive: true })
    appendFileSync(
      file,
      JSON.stringify({
        time: new Date().toISOString(),
        reference,
        context: truncate(context),
        details: truncate(details)
      }) + '\n'
    )
    trimIfLarge(file)
  } catch (logError) {
    console.error('Could not write the error log:', logError)
  }

  return reference
}
