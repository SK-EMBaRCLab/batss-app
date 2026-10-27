import type { UpdateStatus } from '@shared/update-types'

// Shared between the About page and Settings page so both "Check for
// Updates" buttons behave identically instead of drifting apart.
// `manual` is UpdateState's: a macOS update is installed from Finder.
export function updateButtonLabel(
  status: UpdateStatus,
  progress: number | undefined,
  manual?: boolean
): string {
  switch (status) {
    case 'checking':
      return 'Checking for Updates…'
    case 'available':
      return 'Download Update'
    case 'downloading':
      return `Downloading Update… ${Math.round(progress ?? 0)}%`
    case 'downloaded':
      return manual ? 'Open Update in Finder' : 'Restart & Install Update'
    case 'error':
      return 'Try Again'
    default:
      return 'Check for Updates'
  }
}
