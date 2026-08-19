import { FilePlus2, FolderOpen, Moon, Save, SearchIcon, Settings, Sun } from 'lucide-react'
import { type ReactElement } from 'react'

import { EditableDesignName } from '@/components/editable-design-name'
import { HeaderOverflowMenu } from '@/components/header-overflow-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { initialDesignInput } from '@/lib/schema'
import { useCommandPalette } from '@/stores/command-palette'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { useTheme } from '@/stores/theme'

export function AppHeader(): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const isDark = useTheme((state) => state.isDark)
  const setTheme = useTheme((state) => state.setTheme)
  const design = useDesign((s) => s.design)
  const renameDesign = useDesign((s) => s.renameDesign)
  const newDesign = useDesign((s) => s.newDesign)
  const saveDesign = useDesign((s) => s.saveDesign)
  const loadDesign = useDesign((s) => s.loadDesign)
  const isDirty = useDesign((state) => state.isDirty)
  const setOpen = useCommandPalette((state) => state.setOpen)

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
    <header className="flex h-14 overflow-hidden items-center border-b px-4 text-foreground">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        {/* <AppBreadcrumb /> */}

        {design && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <EditableDesignName name={design.name} onRename={renameDesign} />
            {isDirty && <span className="size-2 rounded-full bg-primary" title="Unsaved changes" />}
          </>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="hidden lg:flex items-center gap-2">
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
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <SearchIcon />

          <span className="hidden xl:inline">Search</span>

          <kbd className="hidden xl:inline pointer-events-none font-mono text-xs">⌘K</kbd>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => navigate('settings')}
        >
          <Settings />
        </Button>
        <div className="lg:hidden">
          <HeaderOverflowMenu
            onNew={handleNew}
            onLoad={handleLoad}
            onSave={saveDesign}
            onSettings={() => navigate('settings')}
            canSave={!!design && isDirty}
          />
        </div>
      </div>
    </header>
  )
}
