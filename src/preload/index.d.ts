import { ElectronAPI } from '@electron-toolkit/preload'
import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type {
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '../shared/simulation-types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    app: {
      version: () => string
      reload: () => Promise<void>
      quit: () => Promise<void>
    }
    runtime: {
      check: () => Promise<RuntimeResult>
      onUpdate: (callback: (update: RuntimeUpdate) => void) => () => void
      onLog: (callback: (line: string) => void) => () => void
    }
    design: {
      setDirty: (dirty: boolean) => void
      saveResult: (data: StudyDesign) => Promise<boolean>
      loadResult: () => Promise<StudyDesign | null>
      onSaveRequested: (callback: () => void) => () => void
      closeConfirmed: () => void
      canLeave: () => Promise<boolean | 'save'>
    }
    simulation: {
      runSimulation: (input: SimulationRunInput) => Promise<SimulationRunResult>
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
