import { Play } from 'lucide-react'
import { type ReactElement } from 'react'

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

export function ResultsEmpty(): ReactElement {
  const loadDesign = useDesign((state) => state.loadDesign)
  const navigate = useNavigation((state) => state.navigate)

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No Results Yet</EmptyTitle>
          <EmptyDescription>
            Run a BATSS simulation for this design, or load a saved design to view its results.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex-row gap-2 justify-center">
          <Button onClick={() => navigate('simulation')}>
            <Play className="mr-2 h-4 w-4" />
            Run Simulation
          </Button>
          <Button variant="outline" onClick={loadDesign}>
            Load Design
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
