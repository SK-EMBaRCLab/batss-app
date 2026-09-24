import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { useRuntime } from '@/stores/runtime'

export function AboutHeader(): ReactElement {
  const status = useRuntime((state) => state.status)
  const checkRuntime = useRuntime((state) => state.checkRuntime)
  const appVersion = useRuntime((state) => state.appVersion)
  const packages = useRuntime((state) => state.packages)
  const updatePackages = useRuntime((state) => state.updatePackages)

  const hasUpdates = packages.some((pkg) => pkg.updateAvailable)

  return (
    <>
      <small className="text-muted-foreground">Version {appVersion}</small>
      <h1 className="text-6xl font-semibold">Albatross</h1>
      <p>
        A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using
        Integrated Nested Laplace Approximations (INLA): ABC-INLA
      </p>
      <Button
        onClick={() => checkRuntime()}
        disabled={status === 'checking'}
        className="max-w-xs justify-self-center"
      >
        Recheck / Install Missing Packages
      </Button>
      <Button
        onClick={() => updatePackages()}
        disabled={status === 'checking' || status === 'installing' || !hasUpdates}
        className="max-w-xs justify-self-center"
        variant={hasUpdates ? 'secondary' : 'ghost'}
      >
        {hasUpdates ? 'Update Packages' : 'Packages Up to Date'}
      </Button>
    </>
  )
}
