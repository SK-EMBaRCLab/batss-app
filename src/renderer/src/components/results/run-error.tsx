import { type ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSelectedEntry } from '@/stores/design'

export function RunError(): ReactElement | null {
  const selectedEntry = useSelectedEntry()

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
