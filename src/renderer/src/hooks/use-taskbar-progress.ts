import { useEffect, useState } from 'react'

import { batchOutcome, type RunOutcome, useActiveRunPercent } from '@/hooks/use-active-run-progress'
import { useBatch } from '@/stores/batch'
import { useEngine } from '@/stores/engine'
import { useSimulation } from '@/stores/simulation'

// Mirrors the running simulation/batch onto the taskbar/dock icon
// (flashing and notifications on finish come from run-alerts.ts in
// main). Lives in App rather than on the Simulation/Batch pages so it
// keeps going while the user is elsewhere. Progress comes from
// useActiveRunPercent; indeterminate when that has nothing to go on.
// A failed run leaves a red bar (Windows only) until the window is
// focused; a cancelled one just clears, since the user did it.
export function useTaskbarProgress(): void {
  const busy = useEngine((s) => s.busy)
  const percent = useActiveRunPercent()

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const finish = (outcome: RunOutcome): void => {
      setShowError(outcome === 'error' && !document.hasFocus())
    }

    const unsubscribeSimulation = useSimulation.subscribe((state, prev) => {
      if (state.lastResult && state.lastResult !== prev.lastResult) {
        finish(state.lastResult.status)
      }
    })

    const unsubscribeBatch = useBatch.subscribe((state, prev) => {
      if (prev.status === 'running' && state.status !== 'running') {
        finish(batchOutcome(state.status))
      }
    })

    const clearError = (): void => setShowError(false)
    window.addEventListener('focus', clearError)

    return () => {
      unsubscribeSimulation()
      unsubscribeBatch()
      window.removeEventListener('focus', clearError)
    }
  }, [])

  useEffect(() => {
    if (busy !== 'idle') {
      // Electron treats any value > 1 as indeterminate on every platform
      if (percent === null) window.app.setProgress(2, 'indeterminate')
      else window.app.setProgress(percent / 100, 'normal')
    } else if (showError) {
      window.app.setProgress(1, 'error')
    } else {
      window.app.setProgress(-1, 'normal')
    }
  }, [busy, percent, showError])
}
