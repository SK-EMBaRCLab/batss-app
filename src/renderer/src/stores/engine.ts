import type { EngineBusy, EngineState } from '@shared/engine-types'
import { create } from 'zustand'

type EngineStore = EngineState & {
  initialized: boolean
  initialize: () => Promise<void>
  /** Optimistically claim the engine. Returns false if already busy. */
  tryAcquire: (kind: Exclude<EngineBusy, 'idle'>) => boolean
  release: () => void
}

export const useEngine = create<EngineStore>((set, get) => ({
  busy: 'idle',
  startedAt: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    window.engine.onState((state) => set(state))

    // Catch up: if the renderer was reloaded mid-run, main is still busy.
    set(await window.engine.get())
  },

  tryAcquire: (kind) => {
    if (get().busy !== 'idle') return false
    set({ busy: kind, startedAt: new Date().toISOString() })
    return true
  },

  release: () => set({ busy: 'idle', startedAt: null })
}))
