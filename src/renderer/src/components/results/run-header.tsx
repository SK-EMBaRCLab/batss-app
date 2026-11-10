import { type ReactElement } from 'react'

export function RunHeader(): ReactElement {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Results</h1>
        <p className="text-muted-foreground">Posterior summaries, diagnostics, and plots.</p>
      </div>
    </header>
  )
}
