import { resolveCoreCount } from '@shared/cores'

// A rough, pre-run "how long will this take" estimate for the Review
// step of the simulation wizard. This is a heuristic, not a
// measurement: there's no stored history of past run durations behind
// it (those live per-result in SimulationResultEntry, but a .design
// file travels across machines, so timings from one computer would be
// misleading on another). Instead this scales a single "seconds per
// INLA fit" guess by how much work the current settings imply, and
// deliberately reports a wide range rather than a single number.
//
// The SECONDS_PER_UNIT_LOW/HIGH constants below are not calibrated
// against real BATSS/INLA timings — they're a starting guess. If real
// usage shows estimates are consistently too high/low, tune them here.
const SECONDS_PER_UNIT_LOW = 0.5
const SECONDS_PER_UNIT_HIGH = 2.5

export type DurationEstimate = {
  minSeconds: number
  maxSeconds: number
}

function toPositiveNumber(value: string | number | undefined): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * Estimates a [min, max] second range for a simulation run, from the
 * same inputs visible on the Review step. Uses the same
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

  const interims = Math.max(1, Math.ceil((N - m0) / m))

  const cores = resolveCoreCount(input.cpuCount ?? 4, input.corePercent, R)

  const workUnits = (R * interims) / cores

  return {
    minSeconds: workUnits * SECONDS_PER_UNIT_LOW,
    maxSeconds: workUnits * SECONDS_PER_UNIT_HIGH
  }
}

type DurationUnit = 's' | 'm' | 'h'

function unitFor(seconds: number): DurationUnit {
  if (seconds < 60) return 's'
  if (seconds < 3600) return 'm'
  return 'h'
}

function toUnit(seconds: number, unit: DurationUnit): number {
  if (unit === 's') return seconds
  if (unit === 'm') return seconds / 60
  return seconds / 3600
}

// Rounds to "nice" numbers so the range doesn't look falsely precise
// (e.g. "~11-54s" instead of "~10.8-53.6s").
function roundNice(value: number, unit: DurationUnit): number {
  if (unit === 's') return Math.max(5, Math.round(value / 5) * 5)
  if (unit === 'm') return value < 10 ? Math.max(1, Math.round(value)) : Math.round(value / 5) * 5
  return Math.max(0.5, Math.round(value * 2) / 2)
}

/** Formats a min/max second range as a short, rough label — "~10-45s", "~2-6m", "~1-2h". */
export function formatEstimatedDurationRange(minSeconds: number, maxSeconds: number): string {
  const low = Math.max(1, minSeconds)
  const high = Math.max(low * 1.15, maxSeconds)

  const unit = unitFor(high)
  const lowRounded = roundNice(toUnit(low, unit), unit)
  let highRounded = roundNice(toUnit(high, unit), unit)

  if (highRounded <= lowRounded) {
    highRounded = lowRounded + (unit === 'h' ? 0.5 : 1)
  }

  return `~${lowRounded}–${highRounded}${unit}`
}
