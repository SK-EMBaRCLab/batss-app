import { useEffect, useState } from 'react'

import { toast } from '@/components/ui/toast'

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
      .catch((loadError) => console.error('Loading a setting failed:', loadError))
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
      console.error('Saving a setting failed:', saveError)
      toast.add({ type: 'error', title: 'Could not save', description: 'Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return { value, setValue, isLoading, isSaving, isDirty, error, saveValue }
}
