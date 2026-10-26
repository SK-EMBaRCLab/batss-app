import { type ReactElement, useEffect, useState } from 'react'

import { Banner } from '@/components/common/banner'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useUpdate } from '@/stores/update'

const RELEASES_URL = 'https://github.com/SK-EMBaRCLab/batss-app/releases/latest'

// Unlike AppBanner's R-package banner, update state doesn't need to
// survive a restart — a plain in-memory dismiss key is enough.
export function UpdateBanner(): ReactElement | null {
  const status = useUpdate((state) => state.status)
  const message = useUpdate((state) => state.message)
  const version = useUpdate((state) => state.version)
  const error = useUpdate((state) => state.error)
  const silent = useUpdate((state) => state.silent)
  const install = useUpdate((state) => state.install)
  const download = useUpdate((state) => state.download)

  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  // "You're up to date" is a one-off confirmation, not something that
  // needs to sit around as a persistent banner. Suppressed for the
  // automatic launch check — only a user-triggered check should hear
  // "nothing to do here".
  useEffect(() => {
    if (status === 'not-available' && !silent) {
      toast.add({ type: 'success', description: message || "You're up to date." })
    }
  }, [status, message, silent])

  if (status === 'available') {
    const key = `available:${version}`
    if (dismissedKey === key) return null

    return (
      <Banner
        variant="info"
        title={message}
        description="Download it now, or later from Settings."
        action={
          <Button size="sm" onClick={() => void download()}>
            Download
          </Button>
        }
        dismissible
        onDismiss={() => setDismissedKey(key)}
      />
    )
  }

  if (status === 'downloading') {
    return (
      <Banner
        variant="loading"
        title={message}
        description={version ? `Version ${version}` : undefined}
      />
    )
  }

  if (status === 'downloaded') {
    const key = `downloaded:${version}`
    if (dismissedKey === key) return null

    return (
      <Banner
        variant="success"
        title={message}
        description="Restart Albatross to finish installing it."
        action={
          <Button size="sm" onClick={() => install()}>
            Restart & Install
          </Button>
        }
        dismissible
        onDismiss={() => setDismissedKey(key)}
      />
    )
  }

  if (status === 'error') {
    // The automatic launch check fails on its own on platforms that
    // can't self-update (see update.service.ts) — don't greet users
    // with an error banner every time they open the app for that.
    if (silent) return null

    const key = `error:${error}`
    if (dismissedKey === key) return null

    return (
      <Banner
        variant="error"
        title={message}
        description={error}
        action={
          <Button
            size="sm"
            variant="outline"
            render={<a href={RELEASES_URL} target="_blank" rel="noreferrer" />}
          >
            View releases on GitHub
          </Button>
        }
        dismissible
        onDismiss={() => setDismissedKey(key)}
      />
    )
  }

  return null
}
