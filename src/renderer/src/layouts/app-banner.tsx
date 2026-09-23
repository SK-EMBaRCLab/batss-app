import { type ReactElement, useState } from 'react'

import { Banner } from '@/components/common/banner'
import { Button } from '@/components/ui/button'
import { useRuntime } from '@/stores/runtime'

const DISMISSED_BANNER_KEY = 'albatross:dismissed-banner'

function readDismissedKey(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_BANNER_KEY)
  } catch {
    // localStorage can throw in some sandboxed contexts — fail open
    // (banner just won't remember dismissal) rather than crash.
    return null
  }
}

function writeDismissedKey(key: string): void {
  try {
    window.localStorage.setItem(DISMISSED_BANNER_KEY, key)
  } catch {
    // Ignore — see readDismissedKey.
  }
}

export function AppBanner(): ReactElement | null {
  const [dismissedKey, setDismissedKey] = useState<string | null>(() => readDismissedKey())

  const status = useRuntime((state) => state.status)
  const message = useRuntime((state) => state.message)
  const error = useRuntime((state) => state.error)
  const packages = useRuntime((state) => state.packages)
  const updatePackages = useRuntime((state) => state.updatePackages)

  const packagesWithUpdates = packages.filter((pkg) => pkg.updateAvailable)

  const updateKey = packagesWithUpdates
    .map((pkg) => `${pkg.name}@${pkg.latestVersion}`)
    .sort()
    .join(',')

  const dismiss = (key: string): void => {
    setDismissedKey(key)
    writeDismissedKey(key)
  }

  if (status === 'installing') {
    return (
      <Banner
        variant="loading"
        title={message || 'Updating R packages'}
        description="Please wait while the packages are updated."
      />
    )
  }

  if (status === 'ready' && packagesWithUpdates.length > 0 && dismissedKey !== updateKey) {
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
        onDismiss={() => dismiss(updateKey)}
      />
    )
  }

  switch (status) {
    case 'ready':
      if (dismissedKey === `ready:${message}`) return null
      return (
        <Banner
          variant="success"
          title={message}
          dismissible
          onDismiss={() => dismiss(`ready:${message}`)}
        />
      )

    case 'error':
      if (dismissedKey === `error:${message}`) return null
      return (
        <Banner
          variant="error"
          title={message}
          description={error}
          dismissible
          onDismiss={() => dismiss(`error:${message}`)}
        />
      )

    default:
      return null
  }
}
