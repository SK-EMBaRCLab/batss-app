import { JSX, useEffect, useState } from 'react'
import { FolderOpen } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldLabel, FieldDescription, FieldContent } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Settings(): JSX.Element {
  const [outputPath, setOutputPath] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

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
    }
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)

    try {
      await window.settings.setOutputPath(outputPath)
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <p className="text-muted-foreground mt-2">Application settings.</p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Output Location</CardTitle>

          <CardDescription>
            Choose the folder where simulation results and exported files are saved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="output-path">Output folder</FieldLabel>

              <div className="flex gap-2">
                <Input
                  id="output-path"
                  value={outputPath}
                  onChange={(event) => {
                    setOutputPath(event.target.value)
                    setIsDirty(true)
                  }}
                  disabled={isLoading}
                  placeholder="Select a folder"
                  autoComplete="off"
                />

                <Button type="button" variant="outline" onClick={handleBrowse} disabled={isLoading}>
                  <FolderOpen />
                  Browse
                </Button>
              </div>

              <FieldDescription>
                {isDirty ? 'Unsaved changes.' : 'Files created by Albatross are written here.'}
              </FieldDescription>
            </FieldContent>
          </Field>

          <Button onClick={handleSave} disabled={isLoading || isSaving || !isDirty}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
