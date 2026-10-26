import type { AppearanceState, IconAppearance, ThemeSource } from '@shared/appearance-types'
import { create } from 'zustand'

export type Theme = ThemeSource

type ThemeState = {
  theme: Theme
  isDark: boolean
  iconAppearance: IconAppearance
  initialized: boolean
  initialize: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  setIconAppearance: (choice: IconAppearance) => Promise<void>
}

export const useTheme = create<ThemeState>((set, get) => {
  const applyAppearance = ({ source, dark, iconAppearance }: AppearanceState): void => {
    set({ theme: source, isDark: dark, iconAppearance })
    document.documentElement.classList.toggle('dark', dark)
  }

  return {
    theme: 'system',
    isDark: false,
    iconAppearance: 'theme',
    initialized: false,

    initialize: async () => {
      if (get().initialized) return
      set({ initialized: true })
      // Not inside import.meta.hot?.dispose(...), which production builds
      // skip entirely (see stores/update.ts)
      const unsubscribe = window.theme.onUpdated(applyAppearance)
      // Dev only: a hot-reloaded store would otherwise leave this listener behind
      import.meta.hot?.dispose(unsubscribe)
      applyAppearance(await window.theme.get())
    },

    setTheme: async (theme) => {
      applyAppearance(await window.theme.set(theme))
    },

    setIconAppearance: async (choice) => {
      applyAppearance(await window.theme.setIconAppearance(choice))
    }
  }
})
