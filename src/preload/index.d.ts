import { ElectronAPI } from '@electron-toolkit/preload'
import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type { BatssRunInput, BatssRunResult } from '../shared/batss-types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    runtime: {
      check: () => Promise<RuntimeResult>
      onUpdate: (callback: (update: RuntimeUpdate) => void) => () => void
      onLog: (callback: (line: string) => void) => () => void
    }
    batss: {
      runExample: (input: BatssRunInput) => Promise<BatssRunResult>
      onLog: (callback: (line: string) => void) => () => void
    }
  }
}
