import { type ReactElement } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ViewError } from './view-error'

type Props = {
  children: React.ReactNode
  resetKeys?: unknown[]
}

export function ViewErrorBoundary({ children, resetKeys }: Props): ReactElement {
  return (
    <ErrorBoundary
      FallbackComponent={ViewError}
      resetKeys={resetKeys}
      onError={(error, info) => {
        console.error(error)
        console.error(info.componentStack)

        // window.electronAPI.logError(...)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
