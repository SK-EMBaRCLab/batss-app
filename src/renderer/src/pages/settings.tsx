import type { IconAppearance } from '@shared/appearance-types'
import {
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES
} from '@shared/settings-types'
import { FolderOpen } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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

const items: { label: string; value: Theme }[] = [
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

export default function Settings(): ReactElement {
  const [outputPath, setOutputPath] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [pathError, setPathError] = useState<string | null>(null)

  const [timeoutMinutes, setTimeoutMinutes] = useState('')
  const [isTimeoutLoading, setIsTimeoutLoading] = useState(true)
  const [isTimeoutSaving, setIsTimeoutSaving] = useState(false)
  const [isTimeoutDirty, setIsTimeoutDirty] = useState(false)
  const [timeoutError, setTimeoutError] = useState<string | null>(null)

  const [notifyOnRunFinish, setNotifyOnRunFinish] = useState<boolean | null>(null)

  const theme = useTheme((state) => state.theme)
  const setTheme = useTheme((state) => state.setTheme)

  const iconAppearance = useTheme((state) => state.iconAppearance)
  const setIconAppearance = useTheme((state) => state.setIconAppearance)
  const [isIconSaving, setIsIconSaving] = useState(false)

  const handleIconChange = async (choice: IconAppearance | null): Promise<void> => {
    if (!choice) return
    setIsIconSaving(true)
    try {
      await setIconAppearance(choice)
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not change app icon',
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    } finally {
      setIsIconSaving(false)
    }
  }

  const appVersion = useRuntime((state) => state.appVersion)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  const updateStatus = useUpdate((state) => state.status)
  const updateProgress = useUpdate((state) => state.progress)
  const checkForAppUpdate = useUpdate((state) => state.check)
  const installAppUpdate = useUpdate((state) => state.install)
  const isBusyCheckingForAppUpdate = updateStatus === 'checking' || updateStatus === 'downloading'

  const handleThemeChange = (value: Theme | null): void => {
    if (value) {
      void setTheme(value)
    }
  }

  useEffect(() => {
    let cancelled = false

    window.settings.getOutputPath().then((path) => {
      if (!cancelled) {
        setOutputPath(path)
        setIsLoading(false)
      }
    })

    window.settings.getNotifyOnRunFinish().then((enabled) => {
      if (!cancelled) setNotifyOnRunFinish(enabled)
    })

    window.settings.getSimulationTimeoutMinutes().then((minutes) => {
      if (!cancelled) {
        setTimeoutMinutes(String(minutes))
        setIsTimeoutLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  const handleBrowse = async (): Promise<void> => {
    const selected = await window.settings.selectOutputDirectory()

    if (selected) {
      setOutputPath(selected)
      setIsDirty(true)
      setPathError(null)
    }
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    setPathError(null)

    try {
      const result = await window.settings.setOutputPath(outputPath)

      if (!result.saved) {
        setPathError(result.error ?? 'Could not save this folder.')
        return
      }

      setIsDirty(false)
      toast.add({ type: 'success', description: 'Output folder updated.' })
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTimeout = async (): Promise<void> => {
    setIsTimeoutSaving(true)
    setTimeoutError(null)

    try {
      const parsed = Number(timeoutMinutes.trim())
      const result = await window.settings.setSimulationTimeoutMinutes(parsed)

      if (!result.saved) {
        setTimeoutError(result.error ?? 'Could not save this value.')
        return
      }

      setIsTimeoutDirty(false)
      toast.add({ type: 'success', description: 'Simulation timeout updated.' })
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    } finally {
      setIsTimeoutSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Same column and padding as the other pages, so the heading starts
          in the same place. Settings are grouped into two narrow (max-w-2xl)
          columns side by side once this content area is 64rem wide (a
          container query, so the sidebar is accounted for), stacked in the
          same order below that. */}
      <div className="@container mx-auto max-w-352 p-6">
        <h1 className="text-xl font-semibold">Settings</h1>

        <p className="text-muted-foreground mt-2">
          Customize the theme, notifications and how simulations run.
        </p>

        <div className="mt-8 grid items-start gap-8 @5xl:grid-cols-2">
          <section className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">General</h2>

            <Item variant="muted">
              <ItemContent>
                <ItemTitle>Color Scheme</ItemTitle>
                <ItemDescription>
                  Choose whether Albatross follows the system, light, or dark theme.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Select items={items} value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-45" aria-label="Color scheme">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </ItemActions>
            </Item>

            <Item variant="muted">
              <ItemContent>
                <ItemTitle>App Icon</ItemTitle>
                <ItemDescription>
                  Follow the color scheme or choose a fixed icon for the sidebar and macOS Dock. The
                  Dock icon updates while Albatross is running.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Select
                  items={iconItems}
                  value={iconAppearance}
                  onValueChange={handleIconChange}
                  disabled={isIconSaving}
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

            <Item variant="muted">
              <ItemContent>
                <ItemTitle>Notify me when a run finishes</ItemTitle>
                <ItemDescription>
                  Shows a system notification, with your system&apos;s notification sound, when a
                  simulation or batch finishes, even while Albatross is open.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Checkbox
                  aria-label="Notify me when a run finishes"
                  checked={notifyOnRunFinish ?? false}
                  disabled={notifyOnRunFinish === null}
                  onCheckedChange={(checked) => {
                    setNotifyOnRunFinish(checked)
                    void window.settings.setNotifyOnRunFinish(checked)
                  }}
                />
              </ItemActions>
            </Item>

            <Item variant="muted">
              <ItemContent>
                <ItemTitle>Software Updates</ItemTitle>
                <ItemDescription>
                  {appVersion ? `You're on version ${appVersion}.` : 'Check for a newer version.'}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  onClick={() =>
                    updateStatus === 'downloaded' ? installAppUpdate() : checkForAppUpdate()
                  }
                  disabled={isBusyCheckingForAppUpdate}
                >
                  {updateButtonLabel(updateStatus, updateProgress)}
                </Button>
              </ItemActions>
            </Item>
          </section>

          <section className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">Simulation</h2>

            <Card>
              <CardHeader>
                <CardTitle>Output Location</CardTitle>

                <CardDescription>
                  Choose the folder where simulation results and exported files are saved.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Field data-invalid={!!pathError} orientation="responsive">
                  <FieldContent>
                    <FieldLabel htmlFor="output-path">Output folder</FieldLabel>

                    <div className="flex gap-2">
                      <Input
                        id="output-path"
                        value={outputPath}
                        onChange={(event) => {
                          setOutputPath(event.target.value)
                          setIsDirty(true)
                          if (pathError) setPathError(null)
                        }}
                        disabled={isLoading}
                        placeholder="Select a folder"
                        autoComplete="off"
                        aria-invalid={!!pathError}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBrowse}
                        disabled={isLoading}
                      >
                        <FolderOpen />
                        Browse
                      </Button>
                    </div>

                    <FieldDescription>
                      {isDirty
                        ? 'Unsaved changes.'
                        : 'Files created by Albatross are written here.'}
                    </FieldDescription>

                    {pathError && <FieldError>{pathError}</FieldError>}
                  </FieldContent>
                </Field>

                <Button onClick={handleSave} disabled={isLoading || isSaving || !isDirty}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Simulation Timeout</CardTitle>

                <CardDescription>
                  A run is automatically cancelled if it hasn&apos;t finished within this many
                  minutes. Raise this for large designs (high R, many interim analyses) or slower
                  machines.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Field data-invalid={!!timeoutError} orientation="responsive">
                  <FieldContent>
                    <FieldLabel htmlFor="simulation-timeout">Timeout (minutes)</FieldLabel>

                    <Input
                      id="simulation-timeout"
                      type="number"
                      min={MIN_SIMULATION_TIMEOUT_MINUTES}
                      max={MAX_SIMULATION_TIMEOUT_MINUTES}
                      step={1}
                      value={timeoutMinutes}
                      onChange={(event) => {
                        setTimeoutMinutes(event.target.value)
                        setIsTimeoutDirty(true)
                        if (timeoutError) setTimeoutError(null)
                      }}
                      disabled={isTimeoutLoading}
                      autoComplete="off"
                      aria-invalid={!!timeoutError}
                      className="max-w-40"
                    />

                    <FieldDescription>
                      {isTimeoutDirty
                        ? 'Unsaved changes.'
                        : `Enter a value between ${MIN_SIMULATION_TIMEOUT_MINUTES} and ${MAX_SIMULATION_TIMEOUT_MINUTES} minutes.`}
                    </FieldDescription>

                    {timeoutError && <FieldError>{timeoutError}</FieldError>}
                  </FieldContent>
                </Field>

                <Button
                  onClick={handleSaveTimeout}
                  disabled={isTimeoutLoading || isTimeoutSaving || !isTimeoutDirty}
                >
                  {isTimeoutSaving ? 'Saving…' : 'Save'}
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
