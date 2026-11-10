// See shared/error-reference.ts for why unexpected errors are shown as a
// generic message plus a reference.
import { createErrorReference, withReference } from '@shared/error-reference'

import { toError } from '@/lib/utils'

export { createErrorReference, withReference }

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

/** Records something that failed unexpectedly in the error log, under a new reference. */
export function logFailure(error: unknown, context: string): string {
  const reference = createErrorReference()
  logError(reference, toError(error), context)
  return reference
}

/**
 * For something that failed unexpectedly (a request, not the user's
 * input): records it like logFailure() and returns `message` with the
 * reference appended, to show users (and, for a run, to save with the
 * design). Support can then find the details.
 */
export function requestFailed(
  error: unknown,
  context: string,
  message: string
): { reference: string; message: string } {
  const reference = logFailure(error, context)
  return { reference, message: withReference(message, reference) }
}
