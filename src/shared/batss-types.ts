// src/shared/batss-types.ts
//
// Shared between the renderer (BatssTest form) and main (BatssService),
// same reasoning as runtime-types.ts: one definition, not two that can
// silently drift apart.

export type BatssRunInput = {
  // 'A' = positive primary outcome -> alternative = "greater"
  // 'B' = negative primary outcome -> alternative = "less"
  primaryOutcome: 'A' | 'B'
  probability: number
  deltaEff: number
  b: number
  N: number
  m0: number
  m: number
  R: number
}

export type BatssRunResult = {
  status: 'success' | 'error'
  package?: string
  message?: string
  data?: unknown
}
