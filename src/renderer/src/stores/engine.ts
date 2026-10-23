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

    let receivedPush = false
    const unsubscribe = window.engine.onState((state) => {
      receivedPush = true
      set(state)
    })
    // Dev only: a hot-reloaded store would otherwise leave this listener behind
    import.meta.hot?.dispose(unsubscribe)

    // Catch up: if the renderer was reloaded mid-run, main is still busy.
    // Skipped if a pushed state or a local tryAcquire landed while this
    // was in flight, since either is newer than the snapshot.
    const snapshot = await window.engine.get()
    if (!receivedPush && get().busy === 'idle') set(snapshot)
  },

  tryAcquire: (kind) => {
    if (get().busy !== 'idle') return false
    set({ busy: kind, startedAt: new Date().toISOString() })
    return true
  },

  release: () => set({ busy: 'idle', startedAt: null })
}))
