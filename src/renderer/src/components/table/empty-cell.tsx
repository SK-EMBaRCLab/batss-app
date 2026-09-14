import type { ReactNode } from 'react'

type CellState = 'missing' | 'not-applicable'

export function EmptyCell({ state = 'missing' }: { state?: CellState }): ReactNode {
  return (
    <span
      className="text-muted-foreground"
      title={state === 'not-applicable' ? 'Not applicable for this outcome type' : 'No data'}
    >
      {state === 'not-applicable' ? 'N/A' : '—'}
    </span>
  )
}
