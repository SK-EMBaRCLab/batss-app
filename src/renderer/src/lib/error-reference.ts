// Unexpected errors are shown to users as a generic message plus a short
// reference, not the raw message and stack trace (which expose file paths
// and code details and mean nothing to users). The full error is logged
// under the same reference and included in "Copy details", so a support
// request can be matched to it.

/** A short, readable reference such as "7F3K-92QD". */
export function createErrorReference(): string {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `${id.slice(0, 4)}-${id.slice(4)}`
}

/** Full details for support: the reference, the error, and its stack. */
export function errorDetails(reference: string, error: Error): string {
  return [`Reference: ${reference}`, `${error.name}: ${error.message}`, '', error.stack ?? '']
    .join('\n')
    .trim()
}

export function logError(reference: string, error: Error): void {
  console.error(`[${reference}]`, error)
}
