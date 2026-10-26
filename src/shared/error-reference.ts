// Unexpected errors are shown to users as a generic message plus a short
// reference, not the raw error text (which can expose file paths,
// usernames and server details, and means nothing to users). The full
// details are recorded under the same reference in the error log (see
// main/services/error-log.service.ts), so a support request quoting the
// reference can be matched to them. Expected, user-facing messages (e.g.
// validation errors) are shown as they are.

/** What a reference looks like: two groups of four hex digits, e.g. "7F3A-92CD". */
export const ERROR_REFERENCE_PATTERN = /^[0-9A-F]{4}-[0-9A-F]{4}$/

/** A short, readable reference such as "7F3A-92CD". */
export function createErrorReference(): string {
  const id = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `${id.slice(0, 4)}-${id.slice(4)}`
}

/** A generic message with its reference appended: "… Reference: 7F3A-92CD". */
export function withReference(message: string, reference: string): string {
  return `${message} Reference: ${reference}`
}
