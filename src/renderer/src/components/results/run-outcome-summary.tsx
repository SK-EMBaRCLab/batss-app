import { type ReactElement, useMemo } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesign } from '@/stores/design'

import { SummaryTable } from './summary-table'

export function RunOutcomeSummary(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )

  const result = selectedEntry?.result

  if (!result || result.status === 'error') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulated Trial Outcome Probability Summary by Scenario</CardTitle>
        <CardDescription>
          The following table summarizes that probabilities of each trial outcome across the
          simulated scenarios. Each column represents a scenario and the probabilities of each trial
          outcome
        </CardDescription>
      </CardHeader>

      <CardContent>
        <SummaryTable rows={result.table} />
      </CardContent>
    </Card>
  )
}
