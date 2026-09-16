import { ChevronDown, Info } from 'lucide-react'
import { type ReactElement, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface CollapsibleInfoPanelProps {
  title: string
  children: ReactNode
}

export function CollapsibleInfoPanel({ title, children }: CollapsibleInfoPanelProps): ReactElement {
  return (
    <Collapsible
      className="shrink-0 rounded-lg border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 h-fit"
      defaultOpen
    >
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            className="group w-full justify-start px-4 py-3 hover:bg-primary/5 rounded-none"
          >
            <Info className="h-4 w-4 text-primary" />

            <span className="font-medium text-primary">{title}</span>

            <ChevronDown className="ml-auto text-muted-foreground group-data-panel-open/button:rotate-180" />
          </Button>
        }
      ></CollapsibleTrigger>

      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
