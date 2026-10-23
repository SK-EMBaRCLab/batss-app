import {
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES
} from '@shared/settings-types'
import { FolderOpen } from 'lucide-react'
import { type ReactElement } from 'react'

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
import { useSavedSetting } from '@/hooks/use-saved-setting'

export function OutputLocationSetting(): ReactElement {
  const setting = useSavedSetting({
    load: () => window.settings.getOutputPath(),
    save: (value) => window.settings.setOutputPath(value),
    savedMessage: 'Output folder updated.'
  })

  const handleBrowse = async (): Promise<void> => {
    const selected = await window.settings.selectOutputDirectory()
    if (selected) setting.setValue(selected)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Output Location</CardTitle>

        <CardDescription>
          Choose the folder where simulation results and exported files are saved.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field data-invalid={!!setting.error} orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="output-path">Output folder</FieldLabel>

            <div className="flex gap-2">
              <Input
                id="output-path"
                value={setting.value}
                onChange={(event) => setting.setValue(event.target.value)}
                disabled={setting.isLoading}
                placeholder="Select a folder"
                autoComplete="off"
                aria-invalid={!!setting.error}
              />

              <Button
                type="button"
                variant="outline"
                onClick={handleBrowse}
                disabled={setting.isLoading}
              >
                <FolderOpen />
                Browse
              </Button>
            </div>

            <FieldDescription>
              {setting.isDirty
                ? 'Unsaved changes.'
                : 'Files created by Albatross are written here.'}
            </FieldDescription>

            {setting.error && <FieldError>{setting.error}</FieldError>}
          </FieldContent>
        </Field>

        <Button
          onClick={setting.saveValue}
          disabled={setting.isLoading || setting.isSaving || !setting.isDirty}
        >
          {setting.isSaving ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function SimulationTimeoutSetting(): ReactElement {
  const setting = useSavedSetting({
    load: async () => String(await window.settings.getSimulationTimeoutMinutes()),
    save: (value) => window.settings.setSimulationTimeoutMinutes(Number(value.trim())),
    savedMessage: 'Simulation timeout updated.'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Timeout</CardTitle>

        <CardDescription>
          A run is automatically cancelled if it hasn&apos;t finished within this many minutes.
          Raise this for large designs (high R, many interim analyses) or slower machines.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field data-invalid={!!setting.error} orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="simulation-timeout">Timeout (minutes)</FieldLabel>

            <Input
              id="simulation-timeout"
              type="number"
              min={MIN_SIMULATION_TIMEOUT_MINUTES}
              max={MAX_SIMULATION_TIMEOUT_MINUTES}
              step={1}
              value={setting.value}
              onChange={(event) => setting.setValue(event.target.value)}
              disabled={setting.isLoading}
              autoComplete="off"
              aria-invalid={!!setting.error}
              className="max-w-40"
            />

            <FieldDescription>
              {setting.isDirty
                ? 'Unsaved changes.'
                : `Enter a value between ${MIN_SIMULATION_TIMEOUT_MINUTES} and ${MAX_SIMULATION_TIMEOUT_MINUTES} minutes.`}
            </FieldDescription>

            {setting.error && <FieldError>{setting.error}</FieldError>}
          </FieldContent>
        </Field>

        <Button
          onClick={setting.saveValue}
          disabled={setting.isLoading || setting.isSaving || !setting.isDirty}
        >
          {setting.isSaving ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  )
}
