import type { DesignInput, SimulationRunInput, SimulationRunResult } from '@shared/simulation-types'
import { create } from 'zustand'

import { type DurationEstimate, estimateSimulationDuration } from '@/lib/duration-estimate'
import { appendLogs, subscribeLogs } from '@/lib/log-buffer'
import { type RunStage, withLogLines } from '@/lib/run-progress'
import { formatDuration } from '@/lib/utils'

import { requestFailed, runWithEngine } from './run-session'

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
  // Which opening of a design this run belongs to (the design store's
  // openCount), so its progress card isn't shown against a design opened
  // afterwards, even the same file again
  designOpenCount: number | null

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
  designOpenCount: null,

  run: (input, formInput) =>
    runWithEngine(
      'simulation',
      (message): SimulationRunResult => ({ status: 'error', message }),
      async (session) => {
        // Clear the last run's stage now: the engine reads as busy from here,
        // and progress (taskbar, run panel) would otherwise show the old
        // run's ~99% while the core count below is fetched
        set({ stage: null, stageStartedAt: null })

        const startedAt = Date.now()
        const cpuCount = await session.cpuCount()
        const estimate = estimateSimulationDuration({ ...input, cpuCount })

        set({
          startedAt,
          endedAt: null,
          stage: 'init',
          stageStartedAt: startedAt,
          estimate,
          lastResult: null,
          designOpenCount: session.openCount,
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
          set((state) => withLogLines(state, lines))
        )

        try {
          const result = await window.simulation
            .runSimulation(input)
            .catch((error): SimulationRunResult => {
              // The run request itself failed (not R). This is also
              // what's saved in the design file.
              const failure = requestFailed(
                error,
                'simulation request',
                'The simulation could not be started.'
              )
              return { status: 'error', message: failure.message }
            })

          session.saveResult({ createdAt: new Date().toISOString(), input, result }, formInput)

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

          return result
        } finally {
          teardownLog()
          set((state) => ({ endedAt: state.endedAt ?? Date.now() }))
        }
      }
    ),

  // Fire-and-forget: the pending run() above settles on its own with a
  // result of status 'cancelled' once main stops the Rscript process.
  cancel: async () => {
    await window.simulation.cancelSimulation()
  }
}))
