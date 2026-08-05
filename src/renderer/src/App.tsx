import { JSX, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import { AppLayout } from '@/layouts/app-layout'
import { views } from '@/config/views'
import { useNavigation } from '@/stores/navigation'
import { useRuntime } from '@/stores/runtime'

import { RuntimeScreen } from '@/components/runtime-screen'
import { WelcomeScreen } from '@/components/welcome-screen'
import { useTheme } from '@/stores/theme'
import { useDesign } from './stores/design'

export default function App(): JSX.Element {
  const currentView = useNavigation((state) => state.currentView)

  const status = useRuntime((state) => state.status)

  const design = useDesign((state) => state.design)

  const initialize = useRuntime((state) => state.initialize)

  const initializeTheme = useTheme((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  if (status === 'checking' || status === 'installing') {
    return <RuntimeScreen />
  }

  if (!design) {
    return <WelcomeScreen />
  }

  return (
    <AppLayout>
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
    </AppLayout>
  )
}
