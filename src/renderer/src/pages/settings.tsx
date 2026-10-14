import {
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES
} from '@shared/settings-types'
import { FolderOpen } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const theme = useTheme((state) => state.theme)
  const setTheme = useTheme((state) => state.setTheme)

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
    <div className="h-full overflow-y-auto p-6 lg:p-16">
      <h1 className="text-xl font-semibold">Settings</h1>

      <p className="text-muted-foreground mt-2">
        Customize preferences and theme and default behaviour.
      </p>

      <div className="flex flex-col gap-4 mt-8 max-w-2xl">
        <Item variant="muted">
          <ItemContent>
            <ItemTitle>Color Scheme</ItemTitle>
            <ItemDescription>
              Choose whether Albatross follows the system, light, or dark theme.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Select items={items} value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-45">
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

        <Card className="mt-6 ">
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
                  {isDirty ? 'Unsaved changes.' : 'Files created by Albatross are written here.'}
                </FieldDescription>

                {pathError && <FieldError>{pathError}</FieldError>}
              </FieldContent>
            </Field>

            <Button onClick={handleSave} disabled={isLoading || isSaving || !isDirty}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Simulation Timeout</CardTitle>

            <CardDescription>
              A run is automatically cancelled if it hasn&apos;t finished within this many minutes.
              Raise this for large designs (high R, many interim analyses) or slower machines.
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
      </div>
    </div>
  )
}
