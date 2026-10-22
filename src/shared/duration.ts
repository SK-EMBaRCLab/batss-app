// Unambiguous, unit-labeled duration for a run that already finished
// (table cells, history lists) — "39s", "3m 45s", "1h 5m 12s" — so it
// reads correctly with no surrounding context needed.
export function formatDurationLabel(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds))

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}
