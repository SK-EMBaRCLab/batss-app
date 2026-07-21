import { JSX } from 'react'
import { Moon, Play, Save, Settings, Sun } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from './app-breadcrumb'
import { useTheme } from '@/stores/theme'

export function AppHeader(): JSX.Element {
  const theme = useTheme((state) => state.theme)
  const setTheme = useTheme((state) => state.setTheme)

  return (
    <header className="flex h-14 items-center border-b px-4 text-foreground">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </div>
    </header>
  )
}
