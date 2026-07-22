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
    theme: {
      get(): Promise<{
        source: 'system' | 'light' | 'dark'
        dark: boolean
      }>

      set(theme: 'system' | 'light' | 'dark'): Promise<void>

      onUpdated(
        callback: (theme: { source: 'system' | 'light' | 'dark'; dark: boolean }) => void
      ): () => void
    }
    settings: {
      getOutputPath: () => Promise<string>
      setOutputPath: (outputPath: string) => Promise<string>
      selectOutputDirectory: () => Promise<string | null>
    }
  }
}
