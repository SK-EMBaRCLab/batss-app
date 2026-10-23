import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { type ReactElement, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePersistentBoolean } from '@/hooks/use-persistent-boolean'

// Whether the help card beside the form is expanded, remembered across
// sessions
const HELP_OPEN_KEY = 'albatross:simulation-help-open'

/** The current step's help, in a card beside the simulation form (lg and up). */
export function StepHelpCard({
  title,
  children
}: {
  title: string
  children: ReactNode
}): ReactElement {
  const [helpOpen, setHelpOpen] = usePersistentBoolean(HELP_OPEN_KEY, true)

  // A quieter card beside the form, so the form card is only inputs (below
  // lg the form offers a Help sheet instead). Scrolls past the window's
  // height in a plain overflow div rather than ScrollArea, which needs a
  // fixed-height parent.
  return helpOpen ? (
    <Card className="hidden max-h-full w-88 shrink-0 flex-col bg-muted/30 lg:flex">
      <CardHeader className="shrink-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Hide help"
                  onClick={() => setHelpOpen(false)}
                >
                  <PanelRightClose />
                </Button>
              }
            />
            <TooltipContent>Hide help</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 overflow-y-auto px-2">{children}</CardContent>
    </Card>
  ) : (
    // Collapsed to a single button; the form card takes the freed width
    <Card className="hidden shrink-0 bg-muted/30 p-1 lg:flex">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Show help"
              onClick={() => setHelpOpen(true)}
            >
              <PanelRightOpen />
            </Button>
          }
        />
        <TooltipContent>Show help</TooltipContent>
      </Tooltip>
    </Card>
  )
}
