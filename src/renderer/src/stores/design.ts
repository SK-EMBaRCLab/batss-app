import {
  MAX_DESIGN_DESCRIPTION_LENGTH,
  MAX_RUN_NAME_LENGTH,
  MAX_RUN_NOTES_LENGTH
} from '@shared/design-rules'
import type { DesignInput, SimulationResultEntry, StudyDesign } from '@shared/simulation-types'
import { useMemo } from 'react'
import { create } from 'zustand'

import { toast } from '@/components/ui/toast'
import { requestFailed } from '@/lib/error-reference'

import { useEngine } from './engine'
import { useNavigation } from './navigation'

// Chromium always has crypto.randomUUID, so there's no fallback
function makeId(): string {
  return crypto.randomUUID()
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
  // Goes up every time a design is created, opened or closed, even when
  // the same file is opened again. A run compares it to tell whether the
  // design it started with is still the one open: design ids can't, as
  // reopening a file (or a Save As copy) brings back the same id.
  openCount: number
  filePath: string | null
  selectedResultId: string | null
  // The runs being compared, which the Results page's run list is
  // narrowed to; null shows every run
  selectedResults: string[] | null
  isDirty: boolean

  newDesign: (input: DesignInput, name?: string) => Promise<void>
  startNewDesign: (input: DesignInput, name?: string) => void
  renameDesign: (name: string) => void
  // Sets what the design is for; empty text clears it
  setDescription: (description: string) => void
  appendResult: (entry: Omit<SimulationResultEntry, 'id'>) => void
  updateInput: (input: DesignInput) => void
  selectResult: (id: string) => void
  // Sets a run's name and/or notes; empty text clears them
  editResult: (id: string, changes: { name?: string; notes?: string }) => void
  // Removes runs from the design (gone for good once it's saved)
  deleteResults: (ids: string[]) => void
  // Stops comparing: the run list shows every run again
  showAllResults: () => void
  // Opens the file manager at the saved design file
  showInFolder: () => Promise<void>
  // Show these runs on the Results page, focused on the last one. Two or
  // more are compared (the run list shows only them); one is just opened.
  openResults: (ids: string[]) => void
  saveDesign: () => Promise<boolean>
  saveDesignAs: () => Promise<boolean>
  // From the Open dialog, or from the recent list when given an entry's id
  loadDesign: (recentId?: string) => Promise<boolean>
  closeDesign: () => void
}

export const useDesign = create<DesignState>((set, get) => {
  const setDirty = (dirty: boolean): void => {
    set({ isDirty: dirty })
    window.design.setDirty(dirty)
  }

  // Saves to `knownPath`, or through the save dialog when it's omitted.
  // Returns false if the user cancelled the dialog or the save failed.
  const save = async (knownPath?: string): Promise<boolean> => {
    const { design } = get()
    if (!design) return true

    try {
      const result = await window.design.saveResult(design, knownPath)
      if (!result.saved) return false

      set({ filePath: result.filePath ?? null })
      setDirty(false)
      toast.add({ type: 'success', description: `Design saved: ${design.name}` })

      return true
    } catch (error) {
      // Details go to the error log; the toast says what failed, with the
      // reference to find them by
      const failure = requestFailed(error, 'design save', 'Could not save the design file.')
      toast.add({ type: 'error', title: 'Save failed', description: failure.message })
      return false
    }
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
    openCount: 0,
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

      set((state) => ({
        design,
        openCount: state.openCount + 1,
        filePath: null,
        selectedResultId: null,
        selectedResults: null
      }))

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

    setDescription: (text) => {
      // Trimmed and capped as the file allows; empty means none
      const description = text.trim().slice(0, MAX_DESIGN_DESCRIPTION_LENGTH) || undefined

      set((state) => (state.design ? { design: { ...state.design, description } } : state))

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

    editResult: (id, changes) => {
      // Trimmed and capped as the file allows; empty means none
      const clean = (text: string, max: number): string | undefined =>
        text.trim().slice(0, max) || undefined

      set((state) => {
        if (!state.design) return state
        const results = state.design.results.map((entry) => {
          if (entry.id !== id) return entry
          const next = { ...entry }
          if (changes.name !== undefined) next.name = clean(changes.name, MAX_RUN_NAME_LENGTH)
          if (changes.notes !== undefined) next.notes = clean(changes.notes, MAX_RUN_NOTES_LENGTH)
          return next
        })
        return { design: { ...state.design, results } }
      })
      setDirty(true)
    },

    deleteResults: (ids) => {
      if (ids.length === 0) return
      const gone = new Set(ids)

      set((state) => {
        if (!state.design) return state
        const results = state.design.results.filter((entry) => !gone.has(entry.id))

        // The run being viewed, unless it went: then the newest left
        const selectedResultId =
          state.selectedResultId && !gone.has(state.selectedResultId)
            ? state.selectedResultId
            : (results.at(-1)?.id ?? null)

        // A comparison keeps its remaining runs, and ends below two
        const compared = state.selectedResults?.filter((id) => !gone.has(id)) ?? []

        return {
          design: { ...state.design, results },
          selectedResultId,
          selectedResults: compared.length > 1 ? compared : null
        }
      })
      setDirty(true)
    },
    showAllResults: () => set({ selectedResults: null }),

    showInFolder: async () => {
      const { filePath } = get()
      if (!filePath) return

      const shown = await window.design.showInFolder(filePath)
      if (!shown) {
        toast.add({
          type: 'error',
          title: "Can't show the file",
          description:
            'It may have been moved or deleted. Save the design again to choose a location.'
        })
      }
    },

    openResults: (ids) => {
      const lastId = ids.at(-1)
      if (!lastId) return

      set({ selectedResults: ids.length > 1 ? ids : null, selectedResultId: lastId })
      useNavigation.getState().navigate('results')
    },

    saveDesign: () => save(get().filePath ?? undefined),

    // Always shows the picker, regardless of a remembered path.
    saveDesignAs: () => save(),

    loadDesign: async (recentId) => {
      if (!(await confirmLeave())) return false

      const loaded = recentId
        ? await window.design.openRecent(recentId)
        : await window.design.loadResult()
      if (!loaded) return false

      if (!(await confirmStopActiveRun())) return false

      set((state) => ({
        design: loaded.design,
        openCount: state.openCount + 1,
        filePath: loaded.filePath,
        selectedResultId: loaded.design.results.at(-1)?.id ?? null,
        // The previous design's run ids mean nothing here
        selectedResults: null
      }))

      setDirty(false)
      toast.add({ type: 'success', description: `Design loaded: ${loaded.design.name}` })

      // Always land on Dashboard after a load, regardless of entry point.
      useNavigation.getState().navigate('dashboard')

      return true
    },

    // Drops back to the welcome screen without touching disk.
    closeDesign: () => {
      set((state) => ({
        design: null,
        openCount: state.openCount + 1,
        filePath: null,
        selectedResultId: null,
        selectedResults: null
      }))

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
