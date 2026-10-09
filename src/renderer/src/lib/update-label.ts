import type { UpdateStatus } from '@shared/update-types'

// Shared between the About page and Settings page so both "Check for
// Updates" buttons behave identically instead of drifting apart.
export function updateButtonLabel(status: UpdateStatus, progress: number | undefined): string {
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
