// How runs' dates and durations are written, the same everywhere: the
// runs table, the run list, the dashboard and the batch page. In the
// user's own locale.
import { formatDurationLabel } from '@shared/duration'

/** A run's date and time, e.g. "Nov 10, 2026, 3:05 PM". */
export function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** A date on its own, e.g. "Nov 10, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/** How long a run took, e.g. "2m 3s", or null if it wasn't timed (older results). */
export function formatRunDuration(durationMs: number | undefined): string | null {
  return durationMs == null ? null : formatDurationLabel(durationMs / 1000)
}
