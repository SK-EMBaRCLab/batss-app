import { type ReactElement, useMemo } from 'react'
import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock,
  Package,
  Play,
  Save,
  SquareStack
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'

import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export default function Dashboard(): ReactElement {
  const design = useDesign((s) => s.design)
  const saveDesign = useDesign((s) => s.saveDesign)
  const selectResult = useDesign((s) => s.selectResult)
  const navigate = useNavigation((s) => s.navigate)
  const isDirty = useDesign((state) => state.isDirty)

  const recentRuns = useMemo(() => [...(design?.results ?? [])].reverse().slice(0, 5), [design])

  const latestRun = design?.results.at(-1)

  if (!design) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">No study design is open.</p>
      </div>
    )
  }

  const openResult = (id: string): void => {
    selectResult(id)
    navigate('results')
  }

  const probabilitySymbol = design.input?.decisionRules[0].direction === 'greater' ? '>' : '<'

  const formula =
    design.input?.decisionRules[0].type === 'futility'
      ? `P(OR ${probabilitySymbol} ${design.input?.decisionRules[0].margin ?? '1'}) < ${design.input?.decisionRules[0].threshold ?? '0.05'}`
      : `P(OR ${probabilitySymbol} ${design.input?.decisionRules[0].margin ?? '1'}) > ${design.input?.decisionRules[0].threshold ?? '0.95'}`

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{design.name}</h1>
            <p className="text-muted-foreground mt-1">
              Created {new Date(design.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {design.results.length} run{design.results.length === 1 ? '' : 's'}
            </Badge>
            <Button size="sm" onClick={saveDesign} disabled={!isDirty}>
              <Save className="mr-1.5 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Empty state: design exists but has never been run */}
        {design.results.length === 0 && (
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
        )}

        {design.results.length > 0 && (
          <>
            {/* Quick stats */}
            <ItemGroup className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Item variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <SquareStack />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>Total Runs</ItemDescription>
                  <ItemTitle>{design.results.length}</ItemTitle>
                </ItemContent>
              </Item>

              <Item variant="outline" size="sm">
                <ItemMedia variant="icon">
                  {latestRun?.result.status === 'success' ? (
                    <CheckCircle2 className="text-primary" />
                  ) : (
                    <CircleAlert className="text-destructive" />
                  )}
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>Latest Status</ItemDescription>
                  <ItemTitle>
                    {latestRun?.result.status === 'success' ? 'Success' : 'Error'}
                  </ItemTitle>
                </ItemContent>
              </Item>

              <Item variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Clock />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>Last Run</ItemDescription>
                  <ItemTitle>
                    {latestRun ? new Date(latestRun.createdAt).toLocaleString() : '—'}
                  </ItemTitle>
                </ItemContent>
              </Item>

              <Item variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Package />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>BATSS Version</ItemDescription>
                  <ItemTitle>
                    {latestRun?.result.status === 'success' ? `v${latestRun.result.package}` : '—'}
                  </ItemTitle>
                </ItemContent>
              </Item>
            </ItemGroup>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Design parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Parameters</CardTitle>
                  <CardDescription>Current configuration for this study design.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Parameter label="Outcome Type" value={design.input.outcomeType} />
                    <Parameter
                      label="Probability of outcome in control arm"
                      value={design.input.probability}
                    />
                    <Parameter label="Odds Ratio" value={design.input.treatmentEffect} />
                    <Parameter label="Burn-in (m0)" value={design.input.m0} />
                    <Parameter label="Patients between interims" value={design.input.m} />
                    <Parameter label="Maximum sample size" value={design.input.N} />
                    <Parameter label="Decision Rule" value={formula} />
                    <Parameter label="Number of simulations" value={design.input.R} />
                  </div>
                </CardContent>
              </Card>

              {/* Recent runs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Runs</CardTitle>
                    <CardDescription>Latest results for this design.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('results')}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent>
                  <ItemGroup>
                    {recentRuns.map((entry) => (
                      <Item
                        key={entry.id}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => openResult(entry.id)}
                      >
                        <ItemMedia>
                          {entry.result.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <CircleAlert className="h-4 w-4 text-destructive" />
                          )}
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{new Date(entry.createdAt).toLocaleString()}</ItemTitle>
                          <ItemDescription>
                            {entry.result.status === 'success'
                              ? `BATSS v${entry.result.package}`
                              : entry.result.message}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button onClick={() => navigate('simulation')}>
                <Play className="mr-2 h-4 w-4" />
                Run Another Simulation
              </Button>
              <Button variant="outline" onClick={() => navigate('results')}>
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

function Parameter({
  label,
  value
}: {
  label: string
  value: string | number | undefined
}): ReactElement {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
