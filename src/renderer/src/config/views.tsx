import type { View } from '@/config/navigation'
import About from '@/pages/about'
import Batch from '@/pages/batch'
import Dashboard from '@/pages/dashboard'
import Results from '@/pages/results'
import Settings from '@/pages/settings'
import Simulation from '@/pages/simulation'
import Table from '@/pages/table'

export const views: Record<View, React.ReactNode> = {
  dashboard: <Dashboard />,
  simulation: <Simulation />,
  batch: <Batch />,
  table: <Table />,
  results: <Results />,
  settings: <Settings />,
  about: <About />
}
