import { type ReactElement } from 'react'
import { useState } from 'react'

import { Banner } from '@/components/banner'
import { Button } from '@/components/ui/button'
import { useRuntime } from '@/stores/runtime'

export function AppBanner(): ReactElement | null {
  const [visible, setVisible] = useState(true)

  const status = useRuntime((state) => state.status)
  const message = useRuntime((state) => state.message)
  const error = useRuntime((state) => state.error)
  const packages = useRuntime((state) => state.packages)
  const updatePackages = useRuntime((state) => state.updatePackages)

  if (!visible) {
    return null
  }

  const packagesWithUpdates = packages.filter((pkg) => pkg.updateAvailable)

  if (status === 'installing') {
    return (
      <Banner
        variant="loading"
        title={message || 'Updating R packages'}
        description="Please wait while the packages are updated."
      />
    )
  }

  if (status === 'ready' && packagesWithUpdates.length > 0) {
    return (
      <Banner
        variant="warning"
        title={`${packagesWithUpdates.length} R package${
          packagesWithUpdates.length === 1 ? '' : 's'
        } available`}
        description={packagesWithUpdates
          .map((pkg) => `${pkg.name} ${pkg.version ?? 'N/A'} → ${pkg.latestVersion ?? 'N/A'}`)
          .join(', ')}
        action={
          <Button size="sm" onClick={() => updatePackages()}>
            Update packages
          </Button>
        }
        dismissible
        onDismiss={() => setVisible(false)}
      />
    )
  }

  switch (status) {
    case 'ready':
      return (
        <Banner variant="success" title={message} dismissible onDismiss={() => setVisible(false)} />
      )

    case 'error':
      return (
        <Banner
          variant="error"
          title={message}
          description={error}
          dismissible
          onDismiss={() => setVisible(false)}
        />
      )

    default:
      return null
  }
}
