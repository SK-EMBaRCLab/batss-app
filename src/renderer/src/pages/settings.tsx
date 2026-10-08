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
import { Theme, useTheme } from '@/stores/theme'

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

  const theme = useTheme((state) => state.theme)
  const setTheme = useTheme((state) => state.setTheme)

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

    return () => {
      cancelled = true
    }
  }, [])

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

  return (
    <div className="p-28">
      <h1 className="text-xl font-semibold">Settings</h1>

      <p className="text-muted-foreground mt-2">
        Customize preferences and theme and default behaviour.
      </p>

      <div className="flex flex-col gap-4 mt-8 max-w-2xl">
        <Item variant="muted">
          <ItemContent>
            <ItemTitle>Color Scheme</ItemTitle>
            <ItemDescription>
              Choose wether Albatross follows the system, light, or dark theme.
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
      </div>
    </div>
  )
}
