// The designs opened or saved most recently, for the welcome screen and
// the command palette. Kept free of Electron imports so it can be tested;
// design-files.ipc.ts stores the list in the settings and does the file
// work. The window only ever gets an entry's id back from the user's
// click, never a path, so it can't make the app open any other file.
import path from 'path'

export const MAX_RECENT_DESIGNS = 8

export type RecentDesign = {
  // Kept when the same file is opened again, so the window's list stays put
  id: string
  path: string
  name: string
  description?: string
  // ISO date it was last opened or saved
  openedAt: string
}

const isRecentDesign = (value: unknown): value is RecentDesign => {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.path === 'string' &&
    path.isAbsolute(entry.path) &&
    typeof entry.name === 'string' &&
    typeof entry.openedAt === 'string' &&
    (entry.description === undefined || typeof entry.description === 'string')
  )
}

/** The stored list, without anything that isn't a valid entry (a hand-edited settings file). */
export function readRecentDesigns(stored: unknown): RecentDesign[] {
  return Array.isArray(stored) ? stored.filter(isRecentDesign).slice(0, MAX_RECENT_DESIGNS) : []
}

/** The list with this design at the top: moved up if it was already there, the oldest dropped past the limit. */
export function addRecentDesign(
  list: readonly RecentDesign[],
  design: Omit<RecentDesign, 'id'>,
  makeId: () => string
): RecentDesign[] {
  const resolved = path.resolve(design.path)
  const existing = list.find((entry) => path.resolve(entry.path) === resolved)
  const entry: RecentDesign = {
    ...design,
    id: existing?.id ?? makeId(),
    path: resolved
  }

  return [entry, ...list.filter((other) => other !== existing)].slice(0, MAX_RECENT_DESIGNS)
}

/** The list without that entry. */
export function forgetRecentDesign(list: readonly RecentDesign[], id: string): RecentDesign[] {
  return list.filter((entry) => entry.id !== id)
}
