import type { SimulationRunResult } from '@shared/simulation-types'
import { CircleCheck, CircleSlash, type LucideIcon, TriangleAlert } from 'lucide-react'

export type RunStatus = SimulationRunResult['status']

type RunKind = 'simulation' | 'batch'

// One label, icon and colour per run outcome, so the status card, run
// panel, Batch page, runs history and Dashboard all show the same thing
// (icon rendered by RunStatusIcon). The theme has no success colour, so
// the green lives here.
export const RUN_STATUS: Record<RunStatus, { label: string; icon: LucideIcon; className: string }> =
  {
    success: {
      label: 'Success',
      icon: CircleCheck,
      className: 'text-green-700 dark:text-green-200'
    },
    cancelled: { label: 'Cancelled', icon: CircleSlash, className: 'text-muted-foreground' },
    error: { label: 'Error', icon: TriangleAlert, className: 'text-destructive' }
  }

export function runStatusLabel(status: RunStatus): string {
  return RUN_STATUS[status].label
}

/** One-line detail for a finished run: the BATSS version, or why it didn't succeed. */
export function runResultDetail(result: SimulationRunResult): string {
  return result.status === 'success' ? `BATSS v${result.package}` : result.message
}

/**
 * Heading for a live or just-finished run. 'finished' is for the moment
 * the run has ended but its outcome hasn't been recorded yet.
 */
export function runTitle(kind: RunKind, phase: 'running' | 'finished' | RunStatus): string {
  const noun = kind === 'batch' ? 'Batch' : 'Simulation'

  switch (phase) {
    case 'running':
      return `${noun} running`
    case 'success':
      return `${noun} complete`
    case 'cancelled':
      return `${noun} cancelled`
    case 'error':
      return `${noun} failed`
    case 'finished':
      return `${noun} finished`
  }
}
