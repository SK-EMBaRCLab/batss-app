import { create } from 'zustand'

import type {
  SimulationResultEntry,
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '@shared/simulation-types'

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface DesignState {
  design: StudyDesign | null
  selectedResultId: string | null
  isRunning: boolean

  startNewDesign: (input: SimulationRunInput, name?: string) => void
  renameDesign: (name: string) => void
  runSimulation: (input: SimulationRunInput) => Promise<SimulationRunResult>
  selectResult: (id: string) => void
  saveDesign: () => Promise<void>
  loadDesign: () => Promise<boolean>
  closeDesign: () => void
}

export const useDesign = create<DesignState>((set, get) => ({
  design: null,
  selectedResultId: null,
  isRunning: false,

  startNewDesign: (input, name = 'Untitled Design') => {
    const design: StudyDesign = {
      version: 1,
      id: makeId(),
      name: name.trim() || 'Untitled Design',
      createdAt: new Date().toISOString(),
      input,
      results: []
    }

    set({ design, selectedResultId: null })
  },

  renameDesign: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return

    set((state) => (state.design ? { design: { ...state.design, name: trimmed } } : state))
  },

  runSimulation: async (input) => {
    set({ isRunning: true })

    try {
      const response = await window.simulation.runExample(input)

      set((state) => {
        if (!state.design) return state

        const entry: SimulationResultEntry = {
          id: makeId(),
          createdAt: new Date().toISOString(),
          result: response
        }

        return {
          design: {
            ...state.design,
            input,
            results: [...state.design.results, entry]
          },
          selectedResultId: entry.id
        }
      })

      return response
    } finally {
      set({ isRunning: false })
    }
  },

  selectResult: (id) => set({ selectedResultId: id }),

  saveDesign: async () => {
    const { design } = get()
    if (!design) return

    await window.simulation.saveResult(design)
  },

  loadDesign: async () => {
    const saved = await window.simulation.loadResult()
    if (!saved) return false

    set({
      design: saved,
      selectedResultId: saved.results.at(-1)?.id ?? null
    })

    return true
  },

  // Drops back to the welcome screen without touching disk.
  closeDesign: () => set({ design: null, selectedResultId: null })
}))
