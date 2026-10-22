import type { DesignInput, SimulationResultEntry, StudyDesign } from '@shared/simulation-types'
import { useMemo } from 'react'
import { create } from 'zustand'

import { toast } from '@/components/ui/toast'

import { useEngine } from './engine'
import { useNavigation } from './navigation'

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Runs write their results into the design that started them, so
// switching designs mid-run would orphan (or misfile) them. Asked last,
// once the user has committed to switching (past the unsaved-changes
// prompt and any file picker), so backing out of those never stops a
// run. Cancels via window.* directly rather than the simulation/batch
// stores, which import this one.
async function confirmStopActiveRun(): Promise<boolean> {
  const { busy } = useEngine.getState()
  if (busy === 'idle') return true

  const stop = await window.design.confirmStopRun(busy)
  if (!stop) return false

  await (busy === 'batch' ? window.batch.cancel() : window.simulation.cancelSimulation())
  return true
}

interface DesignState {
  design: StudyDesign | null
  filePath: string | null
  selectedResultId: string | null
  selectedResults: string[] | null
  isDirty: boolean

  newDesign: (input: DesignInput, name?: string) => Promise<void>
  startNewDesign: (input: DesignInput, name?: string) => void
  renameDesign: (name: string) => void
  appendResult: (entry: Omit<SimulationResultEntry, 'id'>) => void
  updateInput: (input: DesignInput) => void
  selectResult: (id: string) => void
  selectResults: (ids: string[]) => void
  saveDesign: () => Promise<boolean>
  saveDesignAs: () => Promise<boolean>
  loadDesign: () => Promise<boolean>
  closeDesign: () => void
}

export const useDesign = create<DesignState>((set, get) => {
  const setDirty = (dirty: boolean): void => {
    set({ isDirty: dirty })
    window.design.setDirty(dirty)
  }

  // The unsaved-changes prompt: false if the user cancelled, or chose
  // Save and the save didn't go through.
  const confirmLeave = async (): Promise<boolean> => {
    const result = await window.design.canLeave()
    if (result === 'save') return get().saveDesign()
    return result
  }

  return {
    design: null,
    filePath: null,
    selectedResultId: null,
    selectedResults: null,
    isDirty: false,

    newDesign: async (input, name = 'Untitled Design') => {
      if (!(await confirmLeave())) return
      if (!(await confirmStopActiveRun())) return

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

      set({ design, filePath: null, selectedResultId: null, selectedResults: null })

      setDirty(true)

      // Always land on the wizard for a new design, regardless of
      // whether this came from the Welcome screen, the header button,
      // or the command palette/⌘N.
      useNavigation.getState().navigate('simulation')
    },

    renameDesign: (name) => {
      const trimmed = name.trim()
      if (!trimmed) return

      set((state) => (state.design ? { design: { ...state.design, name: trimmed } } : state))

      setDirty(true)
    },

    appendResult: (entry) => {
      set((state) => {
        if (!state.design) return state
        const full: SimulationResultEntry = { id: makeId(), ...entry }
        return {
          design: { ...state.design, results: [...state.design.results, full] },
          selectedResultId: full.id,
          selectedResults: null
        }
      })
      setDirty(true)
    },

    updateInput: (input) => {
      set((state) => (state.design ? { design: { ...state.design, input } } : state))
      setDirty(true)
    },

    selectResult: (id) => set({ selectedResultId: id }),
    selectResults: (ids) => set({ selectedResults: ids }),

    saveDesign: async () => {
      const { design, filePath } = get()
      if (!design) return true

      try {
        const result = await window.design.saveResult(design, filePath ?? undefined)

        if (!result.saved) {
          return false
        }

        set({ filePath: result.filePath ?? null })
        setDirty(false)
        toast.add({ type: 'success', description: `Design saved: ${design.name}` })

        return true
      } catch (error) {
        toast.add({
          type: 'error',
          title: 'Save failed',
          description: error instanceof Error ? error.message : 'Could not save the design file.'
        })
        return false
      }
    },

    // Always shows the picker, regardless of a remembered path.
    saveDesignAs: async () => {
      const { design } = get()
      if (!design) return true

      try {
        const result = await window.design.saveResult(design)

        if (!result.saved) return false

        set({ filePath: result.filePath ?? null })
        setDirty(false)
        toast.add({ type: 'success', description: `Design saved: ${design.name}` })

        return true
      } catch (error) {
        toast.add({
          type: 'error',
          title: 'Save failed',
          description: error instanceof Error ? error.message : 'Could not save the design file.'
        })
        return false
      }
    },

    loadDesign: async () => {
      if (!(await confirmLeave())) return false

      const loaded = await window.design.loadResult()
      if (!loaded) return false

      if (!(await confirmStopActiveRun())) return false

      set({
        design: loaded.design,
        filePath: loaded.filePath,
        selectedResultId: loaded.design.results.at(-1)?.id ?? null,
        // The previous design's run ids mean nothing here
        selectedResults: null
      })

      setDirty(false)
      toast.add({ type: 'success', description: `Design loaded: ${loaded.design.name}` })

      // Always land on Dashboard after a load, regardless of entry point.
      useNavigation.getState().navigate('dashboard')

      return true
    },

    // Drops back to the welcome screen without touching disk.
    closeDesign: () => {
      set({
        design: null,
        filePath: null,
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
