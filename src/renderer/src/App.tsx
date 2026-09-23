import { AnimatePresence, motion } from 'motion/react'
import { type ReactElement, useEffect } from 'react'

import { CommandPalette } from '@/components/common/command-palette'
import { RuntimeScreen } from '@/components/common/runtime-screen'
import { ViewErrorBoundary } from '@/components/common/view-error-boundary'
import { WelcomeScreen } from '@/components/common/welcome-screen'
import { views } from '@/config/views'
import { useCommandShortcuts } from '@/hooks/use-command-shortcuts'
import { AppLayout } from '@/layouts/app-layout'
import { useDesign } from '@/stores/design'
import { useEngine } from '@/stores/engine'
import { useNavigation } from '@/stores/navigation'
import { useRuntime } from '@/stores/runtime'
import { useTheme } from '@/stores/theme'

export default function App(): ReactElement {
  const currentView = useNavigation((state) => state.currentView)
  const design = useDesign((state) => state.design)
  const initialize = useRuntime((state) => state.initialize)
  const initializeTheme = useTheme((state) => state.initialize)
  const initializeEngine = useEngine((s) => s.initialize)
  const bootstrapped = useRuntime((state) => state.bootstrapped)

  useCommandShortcuts()

  useEffect(() => {
    initialize()
    initializeTheme()
    initializeEngine()
  }, [initialize, initializeEngine, initializeTheme])

  useEffect(() => {
    const cleanup = window.design.onSaveRequested(async () => {
      const saved = await useDesign.getState().saveDesign()

      if (saved) {
        window.design.closeConfirmed()
      }
    })

    return cleanup
  }, [])

  if (!bootstrapped) {
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
