import { Table } from 'lucide-react'
import { type ReactElement } from 'react'

import { ResultsEmpty } from '@/components/results/results-empty'
import { RunDesignParameters } from '@/components/results/run-design-params'
import { RunError } from '@/components/results/run-error'
import { RunHeader } from '@/components/results/run-header'
import { RunOutcomeSummary } from '@/components/results/run-outcome-summary'
import { RunSampleSizeSummary } from '@/components/results/run-samplesize-summary'
import { RunSummaryChart } from '@/components/results/run-summary-chart'
import { RunsHistory } from '@/components/results/runs-history'
import { Button } from '@/components/ui/button'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export default function Results(): ReactElement {
  const navigate = useNavigation((s) => s.navigate)
  const design = useDesign((state) => state.design)

  if (!design || design.results.length === 0) {
    return <ResultsEmpty />
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 overflow-hidden p-6">
      {/* Run history for this design */}
      <RunsHistory />

      {/* Selected run detail */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        <section className="flex flex-col gap-6">
          <Button variant="link" onClick={() => navigate('table')}>
            <Table />
            Navigate through all designs
          </Button>
          <RunHeader />

          <RunDesignParameters />

          <RunError />

          <RunOutcomeSummary />
          <RunSummaryChart />
          <RunSampleSizeSummary />
        </section>
      </main>
    </div>
  )
}
