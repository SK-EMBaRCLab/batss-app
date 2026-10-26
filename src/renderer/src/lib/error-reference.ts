// See shared/error-reference.ts for why unexpected errors are shown as a
// generic message plus a reference.
export { createErrorReference, withReference } from '@shared/error-reference'

/** Full details for support: the reference, the error, and its stack. */
export function errorDetails(reference: string, error: Error): string {
  return [`Reference: ${reference}`, `${error.name}: ${error.message}`, '', error.stack ?? '']
    .join('\n')
    .trim()
}

/**
 * Logs an unexpected error under `reference`: to the console, and to the
 * error log file in main, so it can still be looked up after the app has
 * closed.
 */
export function logError(reference: string, error: Error, context = 'renderer'): void {
  console.error(`[${reference}]`, error)
  window.app.recordError(reference, context, errorDetails(reference, error))
}
