// The "% of CPU" setting resolved to a BATSS worker count (`mc.cores`).
// One implementation so the main process, which actually runs BATSS,
// the run-time estimate and the CPU usage shown in the wizard all agree.

/** Used when a design predates the setting, so `corePercent` is undefined. */
export const DEFAULT_CORE_PERCENT = 75

/**
 * Workers for `percent` of `totalCores`: at least 1, and never more than
 * `replicates` (R, the number of simulated trials) when that's known,
 * since workers beyond R would just sit idle.
 */
export function resolveCoreCount(
  totalCores: number,
  percent: number = DEFAULT_CORE_PERCENT,
  replicates?: number
): number {
  const requested = Math.max(1, Math.round((totalCores * percent) / 100))
  return replicates && replicates > 0 ? Math.min(requested, replicates) : requested
}
