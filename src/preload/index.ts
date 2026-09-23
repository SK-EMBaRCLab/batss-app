import { contextBridge, ipcRenderer } from 'electron'

import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../shared/batch-types'
import { EngineState } from '../shared/engine-types'
import { IPC } from '../shared/ipc-channels'
import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type {
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '../shared/simulation-types'

const app = {
  version: () => ipcRenderer.invoke(IPC.app.version),
  reload: () => ipcRenderer.invoke(IPC.app.reload),
  quit: () => ipcRenderer.invoke(IPC.app.quit)
}

const runtime = {
  check: (): Promise<RuntimeResult> => ipcRenderer.invoke(IPC.runtime.check),

  update: (packageNames: string[]): Promise<RuntimeResult> =>
    ipcRenderer.invoke(IPC.runtime.update, packageNames),

  onUpdate: (callback: (update: RuntimeUpdate) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: RuntimeUpdate): void => {
      callback(update)
    }
    ipcRenderer.on(IPC.runtime.update, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.runtime.update, listener)
    }
  },

  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => callback(line)
    ipcRenderer.on(IPC.runtime.log, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.runtime.log, listener)
    }
  }
}

const design = {
  setDirty: (dirty: boolean) => ipcRenderer.send(IPC.design.dirty, dirty),

  saveResult: (data: StudyDesign): Promise<boolean> =>
    ipcRenderer.invoke(IPC.design.saveResult, data),

  loadResult: (): Promise<StudyDesign | null> => ipcRenderer.invoke(IPC.design.loadResult),

  onSaveRequested: (callback: () => void) => {
    const listener = (): void => callback()
    ipcRenderer.on(IPC.design.saveRequested, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.design.saveRequested, listener)
    }
  },

  closeConfirmed: () => ipcRenderer.send(IPC.design.closeConfirmed),

  canLeave: (): Promise<boolean | 'save'> => ipcRenderer.invoke(IPC.design.canLeave)
}

const simulation = {
  runSimulation: (input: SimulationRunInput): Promise<SimulationRunResult> =>
    ipcRenderer.invoke(IPC.simulation.run, input),

  cancelSimulation: (): Promise<boolean> => ipcRenderer.invoke(IPC.simulation.cancel),

  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => callback(line)
    ipcRenderer.on(IPC.simulation.log, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.simulation.log, listener)
    }
  }
}

const theme = {
  get: () => ipcRenderer.invoke(IPC.theme.get),

  set: (theme: 'system' | 'light' | 'dark') => ipcRenderer.invoke(IPC.theme.set, theme),

  onUpdated: (
    callback: (theme: { source: 'system' | 'light' | 'dark'; dark: boolean }) => void
  ) => {
    type ThemePayload = { source: 'system' | 'light' | 'dark'; dark: boolean }
    const listener = (_: Electron.IpcRendererEvent, payload: ThemePayload): void =>
      callback(payload)
    ipcRenderer.on(IPC.theme.updated, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.theme.updated, listener)
    }
  }
}

const settings = {
  getOutputPath: (): Promise<string> => ipcRenderer.invoke(IPC.settings.getOutputPath),

  setOutputPath: (outputPath: string): Promise<string> =>
    ipcRenderer.invoke(IPC.settings.setOutputPath, outputPath),

  selectOutputDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.settings.selectOutputDirectory)
}

const batch = {
  run: (inputs: BatchPreparedInput[]): Promise<BatchUpdate> =>
    ipcRenderer.invoke(IPC.batch.run, inputs),

  cancel: (): Promise<boolean> => ipcRenderer.invoke(IPC.batch.cancel),

  onUpdate: (callback: (update: BatchUpdate) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: BatchUpdate): void =>
      callback(update)
    ipcRenderer.on(IPC.batch.update, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.batch.update, listener)
    }
  },

  onRowDone: (callback: (entry: BatchRunEntry) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, entry: BatchRunEntry): void =>
      callback(entry)
    ipcRenderer.on(IPC.batch.rowDone, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.batch.rowDone, listener)
    }
  },

  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => callback(line)
    ipcRenderer.on(IPC.batch.log, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.batch.log, listener)
    }
  }
}

const engine = {
  get: (): Promise<EngineState> => ipcRenderer.invoke(IPC.engine.get),

  onState: (callback: (state: EngineState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: EngineState): void =>
      callback(state)
    ipcRenderer.on(IPC.engine.state, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC.engine.state, listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('app', app)
    contextBridge.exposeInMainWorld('runtime', runtime)
    contextBridge.exposeInMainWorld('design', design)
    contextBridge.exposeInMainWorld('simulation', simulation)
    contextBridge.exposeInMainWorld('theme', theme)
    contextBridge.exposeInMainWorld('settings', settings)
    contextBridge.exposeInMainWorld('batch', batch)
    contextBridge.exposeInMainWorld('engine', engine)
  } catch (error) {
    console.error(error)
  }
}

declare global {
  interface Window {
    app: typeof app
    runtime: typeof runtime
    design: typeof design
    simulation: typeof simulation
    theme: typeof theme
    settings: typeof settings
    batch: typeof batch
    engine: typeof engine
  }
}
