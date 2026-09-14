import type {
  DesignInput,
  SimulationResultEntry,
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '@shared/simulation-types'
import { useMemo } from 'react'
import { create } from 'zustand'

import { toError } from '@/lib/utils'

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface DesignState {
  design: StudyDesign | null
  selectedResultId: string | null
  selectedResults: string[] | null
  isRunning: boolean
  isDirty: boolean

  newDesign: (input: DesignInput, name?: string) => Promise<void>
  startNewDesign: (input: DesignInput, name?: string) => void
  renameDesign: (name: string) => void
  runSimulation: (input: SimulationRunInput, formInput) => Promise<SimulationRunResult>
  cancelSimulation: () => Promise<void>
  selectResult: (id: string) => void
  selectResults: (ids: string[]) => void
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
    selectedResults: null,
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
        selectedResultId: null,
        selectedResults: null
      })

      setDirty(true)
    },

    renameDesign: (name) => {
      const trimmed = name.trim()
      if (!trimmed) return

      set((state) => (state.design ? { design: { ...state.design, name: trimmed } } : state))

      setDirty(true)
    },

    runSimulation: async (input, formInput) => {
      set({ isRunning: true })

      try {
        const response = await window.simulation
          .runSimulation(input)
          .catch((error): SimulationRunResult => ({
            status: 'error',
            message: toError(error).message
          }))

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
              input: formInput ?? state.design.input,
              results: [...state.design.results, entry]
            },
            selectedResultId: entry.id,
            selectedResults: null
          }
        })

        setDirty(true)

        return response
      } finally {
        set({ isRunning: false })
      }
    },

    // Fire-and-forget: cancelling doesn't resolve anything itself — it
    // just asks the main process to abort the in-flight Rscript
    // process. The pending runSimulation() call above settles on its
    // own (with a "Simulation cancelled" error result) once that
    // happens, and its `finally` clears isRunning as usual.
    cancelSimulation: async () => {
      await window.simulation.cancelSimulation()
    },

    selectResult: (id) => set({ selectedResultId: id }),
    selectResults: (ids) => set({ selectedResults: ids }),

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
        selectedResultId: null,
        selectedResults: null
      })

      setDirty(false)
    }
  }
})

export function useSelectedEntry(): SimulationResultEntry | null {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)

  return useMemo(
    () =>
      design?.results.find((entry) => entry.id === selectedResultId) ??
      design?.results.at(-1) ??
      null,
    [design, selectedResultId]
  )
}
