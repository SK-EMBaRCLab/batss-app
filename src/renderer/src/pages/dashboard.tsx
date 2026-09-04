import { BarChart3, Play } from 'lucide-react'
import { type ReactElement } from 'react'

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardParameters } from '@/components/dashboard/dashboard-parameters'
import { DashboardRecentRuns } from '@/components/dashboard/dashboard-runs'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export default function Dashboard(): ReactElement {
  const design = useDesign((s) => s.design)
  const selectResults = useDesign((s) => s.selectResults)
  const navigate = useNavigation((s) => s.navigate)

  if (!design) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">No study design is open.</p>
      </div>
    )
  }

  function viewAllResults(): void {
    selectResults([])
    navigate('results')
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex flex-col gap-6">
        <DashboardHeader />

        {/* Empty state: design exists but has never been run */}
        {design.results.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No runs yet</EmptyTitle>
              <EmptyDescription>
                Configure and run your first simulation for this design.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => navigate('simulation')}>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <DashboardStats />
            <div className="grid gap-4 lg:grid-cols-2">
              <DashboardParameters />
              <DashboardRecentRuns viewAllResults={viewAllResults} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('simulation')}>
                <Play className="mr-2 h-4 w-4" />
                Run Another Simulation
              </Button>
              <Button variant="outline" onClick={() => viewAllResults()}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View All Results
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
