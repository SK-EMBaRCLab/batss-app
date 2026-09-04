import { type ReactElement, useMemo } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesign } from '@/stores/design'

import { SampleSizeTable } from './sample-size-table'

export function RunSampleSizeSummary(): ReactElement | null {
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
        <CardTitle>Simulated Sample Size Summary by Scenario</CardTitle>
        <CardDescription>
          The following tables summarize the simulated sample size distributions under both the null
          effect and target treatment effect scenarios. For each scenario, the tables present the
          mean, minimum, maximum, and a user-selected quantile of the sample size distribution.
          Sample sizes are reported for the total study population as well as separately for the
          control and experimental treatment arms. The quantile slider determines the percentile
          displayed in the quantile column. For example, setting the slider to 0.80 displays the
          80th percentile sample size, meaning that 80% of simulated trials reached a conclusion
          before or at the reported sample size
        </CardDescription>
      </CardHeader>

      <CardContent>
        <SampleSizeTable sampleSize={result.sampleSize} />
      </CardContent>
    </Card>
  )
}
