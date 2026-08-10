import Dashboard from '@/pages/dashboard'
import Settings from '@/pages/settings'
import About from '@/pages/about'
import Simulation from '@/pages/simulation'
import Results from '@/pages/results'

import type { View } from '@/config/navigation'

export const views: Record<View, React.ReactNode> = {
  dashboard: <Dashboard />,
  simulation: <Simulation />,
  results: <Results />,
  settings: <Settings />,
  about: <About />
}
