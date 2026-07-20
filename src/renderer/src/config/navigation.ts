import {
  LayoutDashboard,
  Database,
  FlaskConical,
  Play,
  BarChart3,
  Settings,
  Info
} from 'lucide-react'

export const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    view: 'dashboard'
  },
  {
    title: 'Data',
    icon: Database,
    view: 'data'
  },
  {
    title: 'Model Builder',
    icon: FlaskConical,
    view: 'model'
  },
  {
    title: 'Simulation',
    icon: Play,
    view: 'simulation'
  },
  {
    title: 'Results',
    icon: BarChart3,
    view: 'results'
  },
  {
    title: 'Settings',
    icon: Settings,
    view: 'settings'
  },
  {
    title: 'About',
    icon: Info,
    view: 'about'
  },
  {
    title: 'BATSS Test',
    icon: FlaskConical,
    view: 'batss'
  }
] as const

export type View = (typeof navigationItems)[number]['view']
