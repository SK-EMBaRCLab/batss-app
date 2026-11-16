import { resolveCoreCount } from '@shared/cores'
import { SIMULATION_SCENARIOS } from '@shared/design-rules'

// A rough, pre-run "how long will this take" estimate, used to pace the
// live progress bar. It's the calculation the Review step describes to
// users: about 5 seconds per interim analysis, times the interim analyses
// in one trial ((N - m0) / m), times the simulated trials (R), doubled
// because BATSS runs every trial for the target and the null effect,
// then divided across the cores in use. Keep the two in step.
const SECONDS_PER_INTERIM = 5

// The target effect and the null effect (SIMULATION_SCENARIOS)
const SCENARIOS = SIMULATION_SCENARIOS.length

export type DurationEstimate = {
  seconds: number
}

function toPositiveNumber(value: string | number | undefined): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * Estimates how many seconds a simulation run takes, from the same
 * inputs visible on the Review step. Uses the same
 * resolveCoreCount() as the main process so the "cores" half of the
 * estimate matches what it will actually use, but cpuCount has to be
 * passed in (via window.app.cpuCount()) since only the main process
 * can see the real core count.
 *
 * Returns null when the inputs aren't complete/valid enough to
 * estimate yet (e.g. mid-wizard with fields still unfilled).
 */
export function estimateSimulationDuration(input: {
  N?: string | number
  m0?: string | number
  m?: string | number
  R?: string | number
  corePercent?: number
  cpuCount: number | null
}): DurationEstimate | null {
  const N = toPositiveNumber(input.N)
  const m0 = toPositiveNumber(input.m0)
  const m = toPositiveNumber(input.m)
  const R = toPositiveNumber(input.R)

  if (N === null || m0 === null || m === null || R === null) return null
  if (m0 >= N) return null

  const interims = (N - m0) / m

  const cores = resolveCoreCount(input.cpuCount ?? 4, input.corePercent, R)

  return { seconds: (SECONDS_PER_INTERIM * interims * R * SCENARIOS) / cores }
}
