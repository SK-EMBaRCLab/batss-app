import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { useRuntime } from '@/stores/runtime'
import { useUpdate } from '@/stores/update'

function updateButtonLabel(
  status: ReturnType<typeof useUpdate.getState>['status'],
  progress: number | undefined
): string {
  switch (status) {
    case 'checking':
      return 'Checking for Updates…'
    case 'available':
    case 'downloading':
      return `Downloading Update… ${Math.round(progress ?? 0)}%`
    case 'downloaded':
      return 'Restart & Install Update'
    case 'error':
      return 'Try Again'
    default:
      return 'Check for Updates'
  }
}

export function AboutHeader(): ReactElement {
  const status = useRuntime((state) => state.status)
  const checkRuntime = useRuntime((state) => state.checkRuntime)
  const appVersion = useRuntime((state) => state.appVersion)
  const packages = useRuntime((state) => state.packages)
  const updatePackages = useRuntime((state) => state.updatePackages)

  const updateStatus = useUpdate((state) => state.status)
  const updateProgress = useUpdate((state) => state.progress)
  const checkForAppUpdate = useUpdate((state) => state.check)
  const installAppUpdate = useUpdate((state) => state.install)

  const hasUpdates = packages.some((pkg) => pkg.updateAvailable)
  const isBusyCheckingForAppUpdate = updateStatus === 'checking' || updateStatus === 'downloading'

  return (
    <>
      <small className="text-muted-foreground">Version {appVersion}</small>
      <h1 className="text-6xl font-semibold">Albatross</h1>
      <p>
        A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using
        Integrated Nested Laplace Approximations (INLA): ABC-INLA
      </p>
      <Button
        onClick={() => (updateStatus === 'downloaded' ? installAppUpdate() : checkForAppUpdate())}
        disabled={isBusyCheckingForAppUpdate}
        className="max-w-xs justify-self-center"
      >
        {updateButtonLabel(updateStatus, updateProgress)}
      </Button>
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
