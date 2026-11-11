import { MAX_DESIGN_DESCRIPTION_LENGTH } from '@shared/design-rules'
import { Save } from 'lucide-react'
import { type ReactElement, useId, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/run-format'
import { useDesign } from '@/stores/design'

export function DashboardHeader(): ReactElement | null {
  const design = useDesign((s) => s.design)
  const saveDesign = useDesign((s) => s.saveDesign)
  const isDirty = useDesign((state) => state.isDirty)
  const openCount = useDesign((state) => state.openCount)

  if (!design) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{design.name}</h1>
          <p className="text-muted-foreground mt-1">Created {formatDate(design.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="ghost">
            {design.results.length} run{design.results.length === 1 ? '' : 's'}
          </Badge>
          <Button size="sm" onClick={saveDesign} disabled={!isDirty} variant="secondary">
            <Save className="mr-1.5 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Keyed by the design opened, so what's being typed starts over
          on a new or other design */}
      <DesignDescription key={openCount} description={design.description ?? ''} />
    </div>
  )
}

// The description's character count shows once this close to the limit
const COUNT_FROM = 200

function DesignDescription({ description }: { description: string }): ReactElement {
  const setDescription = useDesign((state) => state.setDescription)
  const [draft, setDraft] = useState(description)
  const id = useId()

  // Saved to the design on leaving the box, not on every key, so the
  // design isn't marked changed by each one (as with a run's notes)
  const save = (): void => {
    if (draft.trim() !== description) setDescription(draft)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Description</Label>
      <Textarea
        id={id}
        value={draft}
        maxLength={MAX_DESIGN_DESCRIPTION_LENGTH}
        placeholder="What is this design for? e.g. Phase II, primary endpoint exacerbations"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
      />
      {draft.length > MAX_DESIGN_DESCRIPTION_LENGTH - COUNT_FROM && (
        <p className="text-right text-xs text-muted-foreground">
          {draft.length}/{MAX_DESIGN_DESCRIPTION_LENGTH}
        </p>
      )}
    </div>
  )
}
