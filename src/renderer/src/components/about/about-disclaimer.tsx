import { TriangleAlert } from 'lucide-react'
import { type ReactElement } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AboutDisclaimer(): ReactElement {
  return (
    <Alert className="max-w-xl justify-self-center border-yellow-200 bg-yellow-50 text-left text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
      <TriangleAlert />
      <AlertTitle>Research tool, not a substitute for formal review</AlertTitle>
      <AlertDescription className="text-yellow-900/80 dark:text-yellow-200/80">
        Albatross is developed by the Heath Lab at SickKids to support methodological work and trial
        planning discussions — it is not intended to replace formal statistical review of a trial
        protocol.
      </AlertDescription>
    </Alert>
  )
}
