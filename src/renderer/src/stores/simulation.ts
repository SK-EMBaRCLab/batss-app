import { describeBusy } from '@shared/engine-types'
import type { DesignInput, SimulationRunInput, SimulationRunResult } from '@shared/simulation-types'
import { create } from 'zustand'

import { toast } from '@/components/ui/toast'
import { type DurationEstimate, estimateSimulationDuration } from '@/lib/duration-estimate'
import { appendLogs, subscribeLogs } from '@/lib/log-buffer'
import { detectRunStage, type RunStage } from '@/lib/run-progress'
import { formatDuration, formatDurationLabel, toError } from '@/lib/utils'

import { useDesign } from './design'
import { useEngine } from './engine'
import { useNavigation } from './navigation'

type SimulationState = {
  logs: string[]
  startedAt: number | null
  endedAt: number | null
  stage: RunStage | null
  stageStartedAt: number | null
  estimate: DurationEstimate | null
  // The outcome of the most recently finished run, so the UI can tell
  // a clean finish apart from an error/cancellation without scraping
  // the raw log text.
  lastResult: SimulationRunResult | null
  // The design this run belongs to, so the progress card isn't shown
  // against a different design opened afterwards.
  designId: string | null

  run: (input: SimulationRunInput, formInput: DesignInput) => Promise<SimulationRunResult>
  cancel: () => Promise<void>
}

export const useSimulation = create<SimulationState>((set) => ({
  logs: [],
  startedAt: null,
  endedAt: null,
  stage: null,
  stageStartedAt: null,
  estimate: null,
  lastResult: null,
  designId: null,

  run: async (input, formInput) => {
    if (!useEngine.getState().tryAcquire('simulation')) {
      return { status: 'error', message: describeBusy(useEngine.getState()) }
    }

    const startedAt = Date.now()
    const designId = useDesign.getState().design?.id ?? null
    const cpuCount = await window.app.cpuCount().catch(() => null)
    const estimate = estimateSimulationDuration({
      N: input.N,
      m0: input.m0,
      m: input.m,
      R: input.R,
      corePercent: input.corePercent,
      cpuCount
    })

    set({
      startedAt,
      endedAt: null,
      stage: 'init',
      stageStartedAt: startedAt,
      estimate,
      lastResult: null,
      designId,
      logs: [
        '> Starting BATSS simulation',
        `> Outcome: ${input.outcomeType}`,
        `> Sample size: N=${input.N}, m0=${input.m0}, m=${input.m}`,
        `> Simulation runs: ${input.R}`,
        `> Decision rules: ${input.decisionRules.length}`,
        ''
      ]
    })

    const teardownLog = subscribeLogs(window.simulation.onLog, (lines) =>
      set((state) => {
        const stageLine = [...lines].reverse().find((line) => detectRunStage(line) !== null)
        const stage = stageLine ? detectRunStage(stageLine) : state.stage

        return {
          logs: appendLogs(state.logs, lines),
          stage,
          stageStartedAt: stage !== state.stage ? Date.now() : state.stageStartedAt
        }
      })
    )

    try {
      const result = await window.simulation
        .runSimulation(input)
        .catch((error): SimulationRunResult => ({
          status: 'error',
          message: toError(error).message
        }))

      // Skip if another design was opened mid-run (the run was stopped
      // to allow that), so the result isn't filed under the wrong one.
      const design = useDesign.getState()
      if (design.design?.id === designId) {
        design.updateInput(formInput)
        design.appendResult({ createdAt: new Date().toISOString(), input, result })
      }

      const endedAt = Date.now()

      set((state) => ({
        endedAt,
        lastResult: result,
        logs: appendLogs(state.logs, [
          '',
          ...(result.status === 'error' ? [`> Error: ${result.message}`] : []),
          `> Completed in ${formatDuration((endedAt - startedAt) / 1000)}`
        ])
      }))

      // Off the Simulation page the user can't see its status (or its
      // jump to Results), so say it finished. Batches always toast; see
      // the batch store.
      const { currentView, navigate } = useNavigation.getState()
      if (currentView !== 'simulation') {
        if (result.status === 'success') {
          toast.add({
            type: 'success',
            title: 'Simulation complete',
            description:
              result.durationMs != null
                ? `Took ${formatDurationLabel(result.durationMs / 1000)}.`
                : undefined,
            actionProps: { children: 'View results', onClick: () => navigate('results') }
          })
        } else if (result.status === 'error') {
          toast.add({
            type: 'error',
            title: 'Simulation failed',
            description: 'See the Simulation page for details.',
            actionProps: { children: 'View details', onClick: () => navigate('simulation') }
          })
        }
      }

      return result
    } finally {
      teardownLog()
      set((state) => ({ endedAt: state.endedAt ?? Date.now() }))
      useEngine.getState().release()
    }
  },

  // Fire-and-forget: the pending run() above settles on its own with a
  // "cancelled" error result once main aborts the Rscript process.
  cancel: async () => {
    await window.simulation.cancelSimulation()
  }
}))
