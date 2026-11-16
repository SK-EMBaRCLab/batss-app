import { TriangleAlert } from 'lucide-react'
import { type ReactElement } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AboutDisclaimer(): ReactElement {
  return (
    <Alert className="max-w-xl justify-self-center border-yellow-200 bg-yellow-50 text-left text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
      <TriangleAlert />
      <AlertTitle>Research tool, not a substitute for a statistician</AlertTitle>
      <AlertDescription className="text-yellow-900/80 dark:text-yellow-200/80">
        BATSS Studio is developed by the EMBaRC Lab at SickKids to support users with the process of
        designing Bayesian adaptive trials. We would encourage users to further discuss their design
        ideas with a Bayesian statistician to ensure that their design aligns with their objectives.
      </AlertDescription>
    </Alert>
  )
}
