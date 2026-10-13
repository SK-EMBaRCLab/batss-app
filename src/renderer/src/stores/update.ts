import { create } from 'zustand'

import type { UpdateState } from '../../../shared/update-types'

type UpdateStore = UpdateState & {
  initialized: boolean
  initialize: () => Promise<void>
  check: (silent?: boolean) => Promise<void>
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

    // Runs once per launch so users learn about a new release without
    // a trip to Settings. Stays silent unless there's actually an
    // update — see check()'s `silent` param and UpdateBanner.
    void get().check(true)
  },

  // Pass no argument (or `false`) for a user-initiated check — e.g.
  // from the Settings button or command palette — so "up to
  // date"/error feedback is shown. The launch check above passes
  // `true` to stay quiet unless an update is actually found.
  check: async (silent = false) => {
    await window.update.check(silent)
  },

  install: () => {
    window.update.install()
  }
}))
