import type { RecentDesignItem } from '@shared/simulation-types'
import { useCallback, useEffect, useState } from 'react'

/**
 * The recently used designs, read from the main process when shown (so a
 * file moved since shows as not found), with ways to tidy the list.
 */
export function useRecentDesigns(): {
  recent: RecentDesignItem[]
  forget: (id: string) => Promise<void>
  clear: () => Promise<void>
} {
  const [recent, setRecent] = useState<RecentDesignItem[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    setRecent(await window.design.recentList())
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const forget = async (id: string): Promise<void> => {
    await window.design.forgetRecent(id)
    await refresh()
  }

  const clear = async (): Promise<void> => {
    await window.design.clearRecent()
    await refresh()
  }

  return { recent, forget, clear }
}
