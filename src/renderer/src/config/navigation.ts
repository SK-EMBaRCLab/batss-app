import { BarChart3, Info, LayoutDashboard, Play, Settings, Table } from 'lucide-react'

export const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    view: 'dashboard'
  },
  {
    title: 'Simulation',
    icon: Play,
    view: 'simulation'
  },
  {
    title: 'Results Table',
    icon: Table,
    view: 'table'
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
  }
] as const

export type View = (typeof navigationItems)[number]['view']
