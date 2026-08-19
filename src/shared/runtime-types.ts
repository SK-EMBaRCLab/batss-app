export type RuntimeStatus = 'idle' | 'checking' | 'installing' | 'ready' | 'error'

export type RuntimeUpdate = {
  status: RuntimeStatus
  progress: number
  message: string
}

export type RuntimePackage = {
  name: string
  installed: boolean
  version?: string
  latestVersion?: string
  updateAvailable: boolean
}

export type RuntimeResult = {
  ready: boolean
  r: boolean
  rVersion?: string
  packages: RuntimePackage[]
}
