import './assets/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import { AppError } from '@/components/app-error'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={AppError}
      onError={(error, info) => {
        console.error(error)
        console.error(info.componentStack)

        // window.electronAPI.logError(...)
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
)
