import { useEffect, useState } from 'react'

import { toast } from '@/components/ui/toast'
import { logFailure, requestFailed } from '@/lib/error-reference'

type SaveResult = { saved: boolean; error?: string }

/**
 * An edit-then-Save setting backed by the main process: loads the stored
 * value, tracks unsaved edits, and saves on request. Validation errors
 * from main are kept for the field to show; anything unexpected becomes a
 * generic toast (details in the console).
 */
export function useSavedSetting({
  load,
  save,
  savedMessage
}: {
  load: () => Promise<string>
  save: (value: string) => Promise<SaveResult>
  savedMessage: string
}): {
  value: string
  setValue: (value: string) => void
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  error: string | null
  saveValue: () => Promise<void>
} {
  const [value, setValueState] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    load()
      .then((stored) => {
        if (!cancelled) setValueState(stored)
      })
      // Keeps showing the default; recorded, as it shouldn't happen
      .catch((loadError) => logFailure(loadError, 'setting load'))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Loaded once; callers pass inline functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setValue = (next: string): void => {
    setValueState(next)
    setIsDirty(true)
    setError(null)
  }

  const saveValue = async (): Promise<void> => {
    setIsSaving(true)
    setError(null)

    try {
      const result = await save(value)

      if (!result.saved) {
        setError(result.error ?? 'Could not save this value.')
        return
      }

      setIsDirty(false)
      toast.add({ type: 'success', description: savedMessage })
    } catch (saveError) {
      const failure = requestFailed(saveError, 'setting save', 'Please try again.')
      toast.add({ type: 'error', title: 'Could not save', description: failure.message })
    } finally {
      setIsSaving(false)
    }
  }

  return { value, setValue, isLoading, isSaving, isDirty, error, saveValue }
}
