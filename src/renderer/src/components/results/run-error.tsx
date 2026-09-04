import { type ReactElement, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesign } from '@/stores/design'

export function RunError(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )

  const result = selectedEntry?.result

  if (result?.status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simulation Error</CardTitle>
        </CardHeader>
        <CardContent>{result.message}</CardContent>
      </Card>
    )
  }

  return null
}
