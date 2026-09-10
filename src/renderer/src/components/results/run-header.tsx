import { type ReactElement } from 'react'

import { Badge } from '@/components/ui/badge'
import { useSelectedEntry } from '@/stores/design'

export function RunHeader(): ReactElement {
  const selectedEntry = useSelectedEntry()

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
