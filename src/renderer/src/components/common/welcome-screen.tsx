import { FilePlus2, FolderOpen } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { initialDesignInput } from '@/lib/schema'
import { useDesign } from '@/stores/design'

export function WelcomeScreen(): ReactElement {
  const newDesign = useDesign((s) => s.newDesign)
  const loadDesign = useDesign((s) => s.loadDesign)

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNew = async (): Promise<void> => {
    const trimmed = name.trim()

    if (!trimmed) {
      setError('Give your study design a name to continue.')
      return
    }

    await newDesign(initialDesignInput, trimmed)
  }

  const handleLoad = async (): Promise<void> => {
    setIsLoading(true)

    try {
      await loadDesign()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Albatross</CardTitle>
          <CardDescription>
            Welcome to the Bayesian Adaptive Trials Simulator Software Application (BATSS App)! This
            app will allow you to create Bayesian adaptive trial designs without the need for
            coding.
          </CardDescription>
          <CardDescription className="mt-1 font-medium text-foreground">
            Start a new study design or load one you saved earlier.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <Field data-invalid={!!error}>
            <FieldContent>
              <FieldLabel htmlFor="design-name">Study design name</FieldLabel>

              <Input
                id="design-name"
                placeholder="e.g. Phase II superiority trial"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleNew()
                }}
                aria-invalid={!!error}
                autoFocus
                autoComplete="off"
              />

              {error && <FieldError>{error}</FieldError>}
            </FieldContent>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => void handleNew()}
            >
              <FilePlus2 className="h-6 w-6" />
              New Study Design
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => void handleLoad()}
              disabled={isLoading}
            >
              <FolderOpen className="h-6 w-6" />
              {isLoading ? 'Loading…' : 'Load Existing Design'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
