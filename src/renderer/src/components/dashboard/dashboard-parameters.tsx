import { type ReactElement } from 'react'

import { DesignParams } from '@/components/design-parameters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesign } from '@/stores/design'

export function DashboardParameters(): ReactElement | null {
  const design = useDesign((s) => s.design)

  if (!design) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Parameters</CardTitle>
        <CardDescription>Current configuration for this study design.</CardDescription>
      </CardHeader>
      <CardContent>
        <DesignParams input={design.input} />
      </CardContent>
    </Card>
  )
}
