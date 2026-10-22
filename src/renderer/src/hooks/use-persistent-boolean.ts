import { useState } from 'react'

import { readStorage, writeStorage } from '@/lib/storage'

/**
 * A boolean UI preference remembered across sessions in localStorage
 * (e.g. whether a panel is collapsed). `defaultValue` applies until the
 * user changes it, or if storage isn't available.
 */
export function usePersistentBoolean(
  key: string,
  defaultValue: boolean
): [boolean, (value: boolean) => void] {
  const [value, setValueState] = useState(() => {
    const stored = readStorage(key)
    return stored === null ? defaultValue : stored === 'true'
  })

  const setValue = (next: boolean): void => {
    setValueState(next)
    writeStorage(key, String(next))
  }

  return [value, setValue]
}
