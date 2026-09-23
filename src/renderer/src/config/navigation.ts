import { BarChart3, FileUp, Info, LayoutDashboard, Play, Settings, Table } from 'lucide-react'

export const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    view: 'dashboard'
  },
  {
    title: 'Run Simulation',
    icon: Play,
    view: 'simulation'
  },
  {
    title: 'Batch Processing',
    icon: FileUp,
    view: 'batch'
  },
  {
    title: 'Simulations Table',
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
