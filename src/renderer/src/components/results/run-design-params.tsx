import { type ReactElement, useMemo } from 'react'

import { DesignParams } from '@/components/design-parameters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesign } from '@/stores/design'

export function RunDesignParameters(): ReactElement | null {
  const design = useDesign((state) => state.design)
  const selectedResultId = useDesign((state) => state.selectedResultId)
  const selectedEntry = useMemo(
    () => design?.results.find((entry) => entry.id === selectedResultId) ?? design?.results.at(-1),
    [design, selectedResultId]
  )
  const input = selectedEntry?.input

  if (!input) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Design Parameters</CardTitle>
      </CardHeader>

      <CardContent>
        <DesignParams input={input} />
      </CardContent>
    </Card>
  )
}
