import { JSX } from 'react'
import { FolderOpen, Moon, Save, Settings, Sun } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from './app-breadcrumb'
import { useTheme } from '@/stores/theme'
import { useBatss } from '@/stores/batss'
import { useNavigation } from '@/stores/navigation'

export function AppHeader(): JSX.Element {
  const navigate = useNavigation((state) => state.navigate)
  const isDark = useTheme((state) => state.isDark)
  const setTheme = useTheme((state) => state.setTheme)
  const saveResults = useBatss((s) => s.saveResults)
  const loadResults = useBatss((s) => s.loadResults)
  const result = useBatss((s) => s.result)

  const handleLoad = async (): Promise<void> => {
    const isLoaded = await loadResults()
    if (isLoaded) {
      navigate('results')
    }
  }

  return (
    <header className="flex h-14 items-center border-b px-4 text-foreground">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <AppBreadcrumb />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleLoad}>
          <FolderOpen />
          Load
        </Button>

        {result && (
          <Button variant="destructive" size="sm" onClick={saveResults} disabled={!result}>
            <Save />
            Save
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('settings')}>
          <Settings />
        </Button>
      </div>
    </header>
  )
}
