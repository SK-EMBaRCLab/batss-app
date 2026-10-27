import type { IconAppearance } from '@shared/appearance-types'
import { FolderSearch } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { updateButtonLabel } from '@/lib/update-label'
import { useRuntime } from '@/stores/runtime'
import { Theme, useTheme } from '@/stores/theme'
import { useUpdate } from '@/stores/update'

const themeItems: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
]

const iconItems: { label: string; value: IconAppearance }[] = [
  { label: 'Follow theme', value: 'theme' },
  { label: 'Teal', value: 'brand' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
]

export function ColorSchemeSetting(): ReactElement {
  const theme = useTheme((state) => state.theme)
  const setTheme = useTheme((state) => state.setTheme)

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Color Scheme</ItemTitle>
        <ItemDescription>
          Choose whether Albatross follows the system, light, or dark theme.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Select
          items={themeItems}
          value={theme}
          onValueChange={(value: Theme | null) => {
            if (value) void setTheme(value)
          }}
        >
          <SelectTrigger className="w-45" aria-label="Color scheme">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {themeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ItemActions>
    </Item>
  )
}

export function AppIconSetting(): ReactElement {
  const iconAppearance = useTheme((state) => state.iconAppearance)
  const setIconAppearance = useTheme((state) => state.setIconAppearance)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = async (choice: IconAppearance | null): Promise<void> => {
    if (!choice) return
    setIsSaving(true)
    try {
      await setIconAppearance(choice)
    } catch (error) {
      console.error('Changing the app icon failed:', error)
      toast.add({
        type: 'error',
        title: 'Could not change app icon',
        description: 'Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>App Icon</ItemTitle>
        <ItemDescription>
          Follow the color scheme or choose a fixed icon for the sidebar and macOS Dock. The Dock
          icon updates while Albatross is running.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Select
          items={iconItems}
          value={iconAppearance}
          onValueChange={handleChange}
          disabled={isSaving}
        >
          <SelectTrigger className="w-45" aria-label="App icon appearance">
            <SelectValue placeholder="App icon" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {iconItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ItemActions>
    </Item>
  )
}

export function NotifySetting(): ReactElement {
  // null until loaded
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    window.settings.getNotifyOnRunFinish().then((value) => {
      if (!cancelled) setEnabled(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = async (checked: boolean): Promise<void> => {
    setEnabled(checked)
    try {
      await window.settings.setNotifyOnRunFinish(checked)
    } catch (error) {
      // Put the checkbox back so it shows what's actually saved
      console.error('Saving the notification setting failed:', error)
      setEnabled(!checked)
      toast.add({ type: 'error', title: 'Could not save', description: 'Please try again.' })
    }
  }

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Notify me when a run finishes</ItemTitle>
        <ItemDescription>
          Shows a system notification, with your system&apos;s notification sound, when a simulation
          or batch finishes, even while Albatross is open.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Checkbox
          aria-label="Notify me when a run finishes"
          checked={enabled ?? false}
          disabled={enabled === null}
          onCheckedChange={(checked) => void handleChange(checked)}
        />
      </ItemActions>
    </Item>
  )
}

export function UpdatesSetting(): ReactElement {
  const appVersion = useRuntime((state) => state.appVersion)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  const status = useUpdate((state) => state.status)
  const progress = useUpdate((state) => state.progress)
  const manual = useUpdate((state) => state.manual)
  const advance = useUpdate((state) => state.advance)
  const isBusy = status === 'checking' || status === 'downloading'

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Software Updates</ItemTitle>
        <ItemDescription>
          {appVersion ? `You're on version ${appVersion}.` : 'Check for a newer version.'}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button onClick={() => void advance()} disabled={isBusy}>
          {updateButtonLabel(status, progress, manual)}
        </Button>
      </ItemActions>
    </Item>
  )
}

export function ErrorLogSetting(): ReactElement {
  const [logPath, setLogPath] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    window.app
      .errorLogPath()
      .then((value) => {
        if (!cancelled) setLogPath(value)
      })
      .catch((error) => console.error('Loading the error log path failed:', error))
    return () => {
      cancelled = true
    }
  }, [])

  const showLog = async (): Promise<void> => {
    try {
      const exists = await window.app.showErrorLog()
      if (!exists) {
        toast.add({ type: 'info', description: 'No errors have been recorded yet.' })
      }
    } catch (error) {
      console.error('Opening the error log failed:', error)
      toast.add({ type: 'error', title: "Couldn't open the error log" })
    }
  }

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Error Log</ItemTitle>
        <ItemDescription>
          Unexpected errors are recorded here under the reference shown in the app. Attach this file
          when reporting a problem. It stays on this computer.
        </ItemDescription>
        {logPath && (
          <ItemDescription className="font-mono text-xs break-all">{logPath}</ItemDescription>
        )}
      </ItemContent>
      <ItemActions>
        <Button variant="outline" onClick={() => void showLog()}>
          <FolderSearch />
          Show Error Log
        </Button>
      </ItemActions>
    </Item>
  )
}
