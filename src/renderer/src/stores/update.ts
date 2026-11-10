import type { UpdateState } from '@shared/update-types'
import { create } from 'zustand'

type UpdateStore = UpdateState & {
  initialized: boolean
  initialize: () => Promise<void>
  check: (silent?: boolean) => Promise<void>
  download: () => Promise<void>
  install: () => void
  // Whatever comes next: install a downloaded update (on macOS, open it
  // in Finder), download an available one, otherwise check. Used by
  // every "update" button.
  advance: () => Promise<void>
}

// Every optional field, unset. Main sends each state whole, so applying
// one starts from these: a merge would keep the last state's version,
// progress or error (e.g. an old error alongside "checking").
// (satisfies: a field added to UpdateState must be listed here too)
const CLEARED = {
  version: undefined,
  progress: undefined,
  error: undefined,
  silent: undefined,
  manual: undefined
} satisfies Record<Exclude<keyof UpdateState, 'status' | 'message'>, undefined>

const replacing = (state: UpdateState): UpdateState => ({ ...CLEARED, ...state })

export const useUpdate = create<UpdateStore>((set, get) => ({
  status: 'idle',
  message: '',
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    // Subscribed on its own line: inside `import.meta.hot?.dispose(...)`
    // it would be skipped in production builds, where import.meta.hot is
    // undefined, and the window would never hear about updates
    let receivedPush = false
    const unsubscribe = window.update.onStatus((state) => {
      receivedPush = true
      set(replacing(state))
    })
    // Dev only: a hot-reloaded store would otherwise leave this listener behind
    import.meta.hot?.dispose(unsubscribe)

    // The state when the window opened. Asked for after subscribing, so no
    // push is missed, but only used if none has arrived: it may be older
    const current = await window.update.get()
    if (!receivedPush) set(replacing(current))

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

  download: async () => {
    await window.update.download()
  },

  install: () => {
    window.update.install()
  },

  advance: async () => {
    const { status, install, download, check } = get()
    if (status === 'downloaded') install()
    else if (status === 'available') await download()
    else await check()
  }
}))
