import { JSX } from 'react'
import { FilePlus2, FolderOpen, Moon, Save, Settings, Sun } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from './app-breadcrumb'
import { useTheme } from '@/stores/theme'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { initialDesignInput } from '@/lib/schema'
import { Separator } from '@/components/ui/separator'
import { EditableDesignName } from '@/components/editable-design-name'

export function AppHeader(): JSX.Element {
  const navigate = useNavigation((state) => state.navigate)
  const isDark = useTheme((state) => state.isDark)
  const setTheme = useTheme((state) => state.setTheme)
  const design = useDesign((s) => s.design)
  const renameDesign = useDesign((s) => s.renameDesign)
  const newDesign = useDesign((s) => s.newDesign)
  const saveDesign = useDesign((s) => s.saveDesign)
  const loadDesign = useDesign((s) => s.loadDesign)
  const isDirty = useDesign((state) => state.isDirty)

  const handleNew = async (): Promise<void> => {
    await newDesign(initialDesignInput)
    navigate('simulation')
  }

  const handleLoad = async (): Promise<void> => {
    const isLoaded = await loadDesign()
    if (isLoaded) {
      navigate('results')
    }
  }

  return (
    <header className="flex h-14 items-center border-b px-4 text-foreground">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <AppBreadcrumb />

        {design && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <EditableDesignName name={design.name} onRename={renameDesign} />
            {isDirty && <span className="size-2 rounded-full bg-primary" title="Unsaved changes" />}
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleNew}>
          <FilePlus2 />
          New
        </Button>

        <Button variant="ghost" size="sm" onClick={handleLoad}>
          <FolderOpen />
          Load
        </Button>

        {design && (
          <Button variant="ghost" size="sm" onClick={saveDesign} disabled={!isDirty}>
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
