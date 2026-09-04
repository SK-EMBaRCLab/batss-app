import { type ReactElement, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { useDesign } from '@/stores/design'

export function RunHeader(): ReactElement {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )

  const result = selectedEntry?.result

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Results</h1>
        <p className="text-muted-foreground">Posterior summaries, diagnostics, and plots.</p>
      </div>

      {result?.status === 'success' && (
        <Badge variant="secondary">{result.package ? `BATSS v${result.package}` : 'BATSS'}</Badge>
      )}
    </header>
  )
}
