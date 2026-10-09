import { create } from 'zustand'

import type { UpdateState } from '../../../shared/update-types'

type UpdateStore = UpdateState & {
  initialized: boolean
  initialize: () => Promise<void>
  check: () => Promise<void>
  install: () => void
}

export const useUpdate = create<UpdateStore>((set, get) => ({
  status: 'idle',
  message: '',
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    window.update.onStatus((state) => set(state))

    const current = await window.update.get()
    set(current)
  },

  // User-initiated only — called from a button, never automatically.
  check: async () => {
    await window.update.check()
  },

  install: () => {
    window.update.install()
  }
}))
