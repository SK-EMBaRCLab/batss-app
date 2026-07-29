// stores/theme.ts
import { create } from 'zustand'

type Theme = 'system' | 'light' | 'dark'

type ThemeState = {
  theme: Theme
  isDark: boolean
  initialize: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
}

export const useTheme = create<ThemeState>((set) => ({
  theme: 'system',
  isDark: false,

  initialize: async () => {
    const { source, dark } = await window.theme.get()

    set({
      theme: source,
      isDark: dark
    })

    document.documentElement.classList.toggle('dark', dark)

    window.theme.onUpdated(({ source, dark }) => {
      set({
        theme: source,
        isDark: dark
      })

      document.documentElement.classList.toggle('dark', dark)
    })
  },

  setTheme: async (theme) => {
    await window.theme.set(theme)

    const { dark } = await window.theme.get()

    set({
      theme,
      isDark: dark
    })

    document.documentElement.classList.toggle('dark', dark)
  }
}))
