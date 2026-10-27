export type UpdateStatus =
  'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export type UpdateState = {
  status: UpdateStatus
  message: string
  version?: string
  progress?: number
  error?: string
  // True when this state came from the automatic launch check rather
  // than a user clicking "Check for Updates". Lets the UI stay quiet
  // about "up to date"/errors on launch while still surfacing a real
  // update via the normal banner.
  silent?: boolean
  // True on macOS once the update's disk image is downloaded: the user
  // installs it by dragging Albatross into Applications, not by restarting.
  manual?: boolean
}
