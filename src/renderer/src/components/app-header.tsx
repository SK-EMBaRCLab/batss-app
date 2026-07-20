import { Play, Save, Settings } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from './app-breadcrumb'

export function AppHeader() {
  return (
    <header className="flex h-14 items-center border-b px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <AppBreadcrumb />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Save />
          Save
        </Button>

        <Button size="sm">
          <Play />
          Run Simulation
        </Button>

        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </div>
    </header>
  )
}
