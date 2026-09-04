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
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="text-muted-foreground">Albatross version {appVersion}</p>
      <p>
        A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using
        Integrated Nested Laplace Approximations (INLA): ABC-INLA
      </p>
      <Button onClick={() => checkRuntime()} disabled={status === 'checking'} className="max-w-xs">
        Recheck / Install Missing Packages
      </Button>
      <Button
        onClick={() => updatePackages()}
        disabled={status === 'checking' || status === 'installing' || !hasUpdates}
        className="max-w-xs"
      >
        {hasUpdates ? 'Update Packages' : 'Packages Up to Date'}
      </Button>
    </>
  )
}
