import { create } from 'zustand'

import type {
  DesignInput,
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
  isDirty: boolean

  newDesign: (input: DesignInput, name?: string) => Promise<void>
  startNewDesign: (input: DesignInput, name?: string) => void
  renameDesign: (name: string) => void
  runSimulation: (input: SimulationRunInput) => Promise<SimulationRunResult>
  selectResult: (id: string) => void
  saveDesign: () => Promise<boolean>
  loadDesign: () => Promise<boolean>
  closeDesign: () => void
}

export const useDesign = create<DesignState>((set, get) => {
  const setDirty = (dirty: boolean): void => {
    set({ isDirty: dirty })
    window.design.setDirty(dirty)
  }

  return {
    design: null,
    selectedResultId: null,
    isRunning: false,
    isDirty: false,

    newDesign: async (input, name = 'Untitled Design') => {
      const result = await window.design.canLeave()

      if (result === false) {
        return
      }

      if (result === 'save') {
        const saved = await get().saveDesign()

        if (!saved) {
          return
        }
      }

      get().startNewDesign(input, name)
    },

    startNewDesign: (input, name = 'Untitled Design') => {
      const design: StudyDesign = {
        version: 2,
        id: makeId(),
        name: name.trim() || 'Untitled Design',
        createdAt: new Date().toISOString(),
        input,
        results: []
      }

      set({
        design,
        selectedResultId: null
      })

      setDirty(true)
    },

    renameDesign: (name) => {
      const trimmed = name.trim()
      if (!trimmed) return

      set((state) => (state.design ? { design: { ...state.design, name: trimmed } } : state))

      setDirty(true)
    },

    runSimulation: async (input) => {
      set({ isRunning: true })

      try {
        const response = await window.simulation.runSimulation(input)

        set((state) => {
          if (!state.design) return state

          const entry: SimulationResultEntry = {
            id: makeId(),
            createdAt: new Date().toISOString(),
            input,
            result: response
          }

          return {
            design: {
              ...state.design,
              results: [...state.design.results, entry]
            },
            selectedResultId: entry.id
          }
        })

        setDirty(true)

        return response
      } finally {
        set({ isRunning: false })
      }
    },

    selectResult: (id) => set({ selectedResultId: id }),

    saveDesign: async () => {
      const { design } = get()
      if (!design) return true

      const saved = await window.design.saveResult(design)

      if (!saved) {
        return false
      }

      setDirty(false)

      return true
    },

    loadDesign: async () => {
      const allowed = await window.design.canLeave()

      if (!allowed) return false

      const saved = await window.design.loadResult()
      if (!saved) return false

      set({
        design: saved,
        selectedResultId: saved.results.at(-1)?.id ?? null
      })

      setDirty(false)

      return true
    },

    // Drops back to the welcome screen without touching disk.
    closeDesign: () => {
      set({
        design: null,
        selectedResultId: null
      })

      setDirty(false)
    }
  }
})
