import { type ReactElement } from 'react'

import { DesignParams } from '@/components/common/design-parameters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSelectedEntry } from '@/stores/design'

export function RunDesignParameters(): ReactElement | null {
  const selectedEntry = useSelectedEntry()
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
