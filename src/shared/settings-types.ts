// Small shared response shape for settings writes that can fail
// validation (e.g. a typed output path that doesn't exist on disk).
export type SetOutputPathResult = { saved: boolean; error?: string }

export type SetSimulationTimeoutResult = { saved: boolean; error?: string }

// Shared between the Settings page (input bounds) and the main-process
// IPC handler (validation) so the two never drift apart. A run is
// aborted if it hasn't finished within this many minutes — see
// SIMULATION_TIMEOUT_MINUTES_KEY's usage in simulation.service.ts.
export const DEFAULT_SIMULATION_TIMEOUT_MINUTES = 120
export const MIN_SIMULATION_TIMEOUT_MINUTES = 5
export const MAX_SIMULATION_TIMEOUT_MINUTES = 360

/**
 * A stored timeout, or the default if it's missing or out of range.
 * settings.json is a plain file, so a hand-edited or damaged value (e.g.
 * "abc", which would time every run out immediately) isn't trusted.
 */
export function normaliseTimeoutMinutes(value: unknown): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_SIMULATION_TIMEOUT_MINUTES &&
    value <= MAX_SIMULATION_TIMEOUT_MINUTES
    ? value
    : DEFAULT_SIMULATION_TIMEOUT_MINUTES
}
