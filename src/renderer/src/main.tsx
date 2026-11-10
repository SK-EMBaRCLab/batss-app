import './assets/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import { AppError } from '@/components/common/app-error'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={AppError}
      // The fallback logs the error itself, with its reference; only the
      // component stack, which it doesn't get, is added here
      onError={(_error, info) => console.error(info.componentStack)}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
)
