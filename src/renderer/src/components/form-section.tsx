import { JSX } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function FormSection({
  title,
  description,
  summary,
  children,
  defaultOpen = true
}: {
  title: string
  description?: string
  summary?: string
  children: React.ReactNode
  defaultOpen?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-lg border border-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
          <div>
            <h3 className="font-medium">{title}</h3>

            {!open && summary && <p className="text-sm text-muted-foreground">{summary}</p>}

            {open && description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>

          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-muted p-4">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
