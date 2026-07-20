// src/shared/runtime-types.ts
//
// Single source of truth for runtime-related types, imported by BOTH the
// main process and the renderer process. Previously these were declared
// independently in src/main/runtime/types.ts and
// src/renderer/src/stores/runtime.ts and had drifted apart (main sent
// `status`, renderer expected `step`), which silently broke the
// "installing" UI state. Keep this the only place these shapes live.

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
}

export type RuntimeResult = {
  ready: boolean
  r: boolean
  packages: RuntimePackage[]
}
