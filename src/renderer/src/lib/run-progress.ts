import { useEffect, useState } from 'react'

import type { DurationEstimate } from './duration-estimate'
import { appendLogs } from './log-buffer'

// The only progress signal a BATSS run actually gives us: batss.glm()
// prints these 4 fixed stage markers via message() (which R sends to
// stderr) as it works through a run — see glm.R in BATSS's source.
// There's no per-replicate signal (the parallel workers don't print
// anything individually), so this drives a *staged* progress bar, not
// a true percent-of-replicates-complete one.
export type RunStage = 'init' | 'h1' | 'h0' | 'results'

const STAGE_MARKERS: Record<string, RunStage> = {
  Initialisation: 'init',
  'Evaluation of H1': 'h1',
  'Evaluation of H0': 'h0',
  Results: 'results'
}

export const STAGE_LABEL: Record<RunStage, string> = {
  init: 'Getting the simulation ready…',
  h1: 'Simulating trials with a treatment effect…',
  h0: 'Simulating trials with no treatment effect…',
  results: 'Putting your results together…'
}

/** Matches a raw line of R output against BATSS's known stage markers. */
export function detectRunStage(line: string): RunStage | null {
  return STAGE_MARKERS[line.trim()] ?? null
}

type StagedLogState = {
  logs: string[]
  stage: RunStage | null
  stageStartedAt: number | null
}

/**
 * Store update for newly flushed R output: appends the lines and moves
 * to the latest stage marker among them, if any. Shared by the
 * simulation and batch stores.
 */
export function withLogLines(state: StagedLogState, lines: string[]): StagedLogState {
  const stageLine = [...lines].reverse().find((line) => detectRunStage(line) !== null)
  const stage = stageLine ? detectRunStage(stageLine) : state.stage

  return {
    logs: appendLogs(state.logs, lines),
    stage,
    stageStartedAt: stage !== state.stage ? Date.now() : state.stageStartedAt
  }
}

// Progress value the bar jumps to the instant each stage marker is
// seen, and the ceiling it creeps toward before the next one arrives.
// "Evaluation of H1"/"Evaluation of H0" are by far the most expensive
// stages (each runs all R replicates) — Init and Results are
// comparatively instantaneous, hence the lopsided ranges.
const STAGE_RANGE: Record<RunStage, { start: number; end: number }> = {
  init: { start: 2, end: 8 },
  h1: { start: 8, end: 50 },
  h0: { start: 50, end: 96 },
  results: { start: 96, end: 99 }
}

// Rough share of the total pre-run estimate (see duration-estimate.ts)
// each stage is expected to take, used only to pace how fast the bar
// creeps toward its ceiling within a stage — not a claim of precision.
const STAGE_SHARE: Record<RunStage, number> = {
  init: 0.04,
  h1: 0.46,
  h0: 0.46,
  results: 0.04
}

function stageBudgetSeconds(stage: RunStage, estimate: DurationEstimate | null): number | null {
  if (!estimate) return null
  const midpoint = (estimate.minSeconds + estimate.maxSeconds) / 2
  return midpoint * STAGE_SHARE[stage]
}

/**
 * Pure function behind the live progress bar: jumps to a stage's
 * starting value the moment it's reached, then creeps toward that
 * stage's ceiling at a pace set by the pre-run duration estimate, so a
 * long phase doesn't just look frozen between stage markers. Callers
 * re-invoke this on a tick (see useRunProgress) to animate it.
 */
export function computeRunProgress({
  stage,
  stageStartedAt,
  estimate,
  now
}: {
  stage: RunStage | null
  stageStartedAt: number | null
  estimate: DurationEstimate | null
  now: number
}): number {
  if (stage === null || stageStartedAt === null) return 0

  const { start, end } = STAGE_RANGE[stage]
  const budget = stageBudgetSeconds(stage, estimate)

  // No estimate to pace against (e.g. incomplete inputs) — just
  // reflect the stage transition itself, no in-between creep.
  if (!budget) return start

  const elapsedSeconds = Math.max(0, (now - stageStartedAt) / 1000)
  const fraction = Math.min(1, elapsedSeconds / budget)

  return start + (end - start) * fraction
}

/**
 * Ticks computeRunProgress() every 250ms while a stage is active,
 * freezing once done. Deliberately doesn't snap to 100 on its own when
 * `done` is true — a run that ends in an error/cancellation shouldn't
 * read as "fully complete". Callers that only care about the success
 * path can just render 100 themselves once done.
 */
export function useRunProgress({
  stage,
  stageStartedAt,
  estimate,
  done
}: {
  stage: RunStage | null
  stageStartedAt: number | null
  estimate: DurationEstimate | null
  done: boolean
}): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (done || stage === null) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [done, stage])

  return computeRunProgress({ stage, stageStartedAt, estimate, now })
}
