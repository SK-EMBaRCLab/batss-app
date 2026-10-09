export type UpdateStatus =
  'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export type UpdateState = {
  status: UpdateStatus
  message: string
  version?: string
  progress?: number
  error?: string
}
