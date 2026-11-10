import { type ReactElement } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { ViewError } from '@/components/common/view-error'

type Props = {
  children: React.ReactNode
  resetKeys?: unknown[]
}

export function ViewErrorBoundary({ children, resetKeys }: Props): ReactElement {
  return (
    <ErrorBoundary
      FallbackComponent={ViewError}
      resetKeys={resetKeys}
      // The fallback logs the error itself, with its reference; only the
      // component stack, which it doesn't get, is added here
      onError={(_error, info) => console.error(info.componentStack)}
    >
      {children}
    </ErrorBoundary>
  )
}
