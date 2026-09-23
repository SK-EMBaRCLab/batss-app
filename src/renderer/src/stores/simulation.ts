import { describeBusy } from '@shared/engine-types'
import type { DesignInput, SimulationRunInput, SimulationRunResult } from '@shared/simulation-types'
import { create } from 'zustand'

import { appendLogs, createLogBatcher } from '@/lib/log-buffer'
import { formatDuration, toError } from '@/lib/utils'

import { useDesign } from './design'
import { useEngine } from './engine'

type SimulationState = {
  logs: string[]
  startedAt: number | null
  endedAt: number | null

  run: (input: SimulationRunInput, formInput: DesignInput) => Promise<SimulationRunResult>
  cancel: () => Promise<void>
}

export const useSimulation = create<SimulationState>((set) => ({
  logs: [],
  startedAt: null,
  endedAt: null,

  run: async (input, formInput) => {
    if (!useEngine.getState().tryAcquire('simulation')) {
      return { status: 'error', message: describeBusy(useEngine.getState()) }
    }

    const startedAt = Date.now()

    set({
      startedAt,
      endedAt: null,
      logs: [
        '> Starting BATSS simulation',
        `> Outcome: ${input.outcomeType}`,
        `> Sample size: N=${input.N}, m0=${input.m0}, m=${input.m}`,
        `> Simulation runs: ${input.R}`,
        `> Decision rules: ${input.decisionRules.length}`,
        ''
      ]
    })

    const batcher = createLogBatcher((lines) =>
      set((state) => ({ logs: appendLogs(state.logs, lines) }))
    )
    const unsubscribe = window.simulation.onLog(batcher.push)

    try {
      const result = await window.simulation
        .runSimulation(input)
        .catch((error): SimulationRunResult => ({
          status: 'error',
          message: toError(error).message
        }))

      const design = useDesign.getState()
      design.updateInput(formInput)
      design.appendResult({ createdAt: new Date().toISOString(), input, result })

      batcher.flush()
      const endedAt = Date.now()

      set((state) => ({
        endedAt,
        logs: appendLogs(state.logs, [
          '',
          ...(result.status === 'error' ? [`> Error: ${result.message}`] : []),
          `> Completed in ${formatDuration((endedAt - startedAt) / 1000)}`
        ])
      }))

      return result
    } finally {
      unsubscribe()
      batcher.flush()
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
