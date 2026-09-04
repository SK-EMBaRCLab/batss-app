import { Save } from 'lucide-react'
import { type ReactElement } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDesign } from '@/stores/design'

export function DashboardHeader(): ReactElement | null {
  const design = useDesign((s) => s.design)
  const saveDesign = useDesign((s) => s.saveDesign)
  const isDirty = useDesign((state) => state.isDirty)

  if (!design) {
    return null
  }

  return (
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
  )
}
