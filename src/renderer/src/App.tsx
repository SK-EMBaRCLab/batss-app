import { JSX, useEffect } from 'react'

import { AppLayout } from '@/layouts/app-layout'
import { views } from '@/config/views'
import { useNavigation } from '@/stores/navigation'
import { useRuntime } from '@/stores/runtime'

import { RuntimeScreen } from '@/components/runtime-screen'
import { useTheme } from '@/stores/theme'

export default function App(): JSX.Element {
  const currentView = useNavigation((state) => state.currentView)

  const status = useRuntime((state) => state.status)

  const initialize = useRuntime((state) => state.initialize)

  const initializeTheme = useTheme((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  if (status !== 'ready') {
    return <RuntimeScreen />
  }

  return <AppLayout>{views[currentView]}</AppLayout>
}
