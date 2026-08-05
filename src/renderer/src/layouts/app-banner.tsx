import { type ReactElement } from 'react'
import { Banner } from '@/components/banner'
import { useRuntime } from '@/stores/runtime'
import { useState } from 'react'

export function AppBanner(): ReactElement | null {
  const [visible, setVisible] = useState(true)
  const status = useRuntime((state) => state.status)
  const message = useRuntime((state) => state.message)
  const error = useRuntime((state) => state.error)

  if (!visible) {
    return null
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
