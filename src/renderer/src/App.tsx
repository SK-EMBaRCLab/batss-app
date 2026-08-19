import { AnimatePresence, motion } from 'motion/react'
import { type ReactElement, useEffect } from 'react'

import { CommandPalette } from '@/components/command-palette'
import { RuntimeScreen } from '@/components/runtime-screen'
import { ViewErrorBoundary } from '@/components/view-error-boundary'
import { WelcomeScreen } from '@/components/welcome-screen'
import { views } from '@/config/views'
import { useCommandShortcuts } from '@/hooks/use-command-shortcuts'
import { AppLayout } from '@/layouts/app-layout'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { useRuntime } from '@/stores/runtime'
import { useTheme } from '@/stores/theme'

export default function App(): ReactElement {
  const currentView = useNavigation((state) => state.currentView)
  const status = useRuntime((state) => state.status)
  const design = useDesign((state) => state.design)
  const initialize = useRuntime((state) => state.initialize)
  const initializeTheme = useTheme((state) => state.initialize)

  useCommandShortcuts()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  useEffect(() => {
    const cleanup = window.design.onSaveRequested(async () => {
      await useDesign.getState().saveDesign()

      window.design.closeConfirmed()
    })

    return cleanup
  }, [])

  if (status === 'checking' || status === 'installing') {
    return <RuntimeScreen />
  }

  if (!design) {
    return <WelcomeScreen />
  }

  return (
    <>
      <CommandPalette />
      <AppLayout>
        <ViewErrorBoundary resetKeys={[currentView]}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="flex h-full min-h-0 flex-1 flex-col"
            >
              {views[currentView]}
            </motion.div>
          </AnimatePresence>
        </ViewErrorBoundary>
      </AppLayout>
    </>
  )
}
