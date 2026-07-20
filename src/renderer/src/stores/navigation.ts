import { create } from 'zustand'
import type { View } from '@/config/navigation'

interface NavigationStore {
  currentView: View
  navigate: (view: View) => void
}

export const useNavigation = create<NavigationStore>((set) => ({
  currentView: 'dashboard',

  navigate: (view) =>
    set({
      currentView: view
    })
}))
