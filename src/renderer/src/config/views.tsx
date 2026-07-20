import Dashboard from '@/pages/dashboard'
import Settings from '@/pages/settings'
import About from '@/pages/about'
import Data from '@/pages/data'
import ModelBuilder from '@/pages/model'
import Simulation from '@/pages/simulation'
import Results from '@/pages/results'

import type { View } from '@/config/navigation'
import BatssTest from '@/pages/batss-test'

export const views: Record<View, React.ReactNode> = {
  dashboard: <Dashboard />,
  data: <Data />,
  model: <ModelBuilder />,
  simulation: <Simulation />,
  results: <Results />,
  settings: <Settings />,
  about: <About />,
  batss: <BatssTest />
}
