import { contextBridge, ipcRenderer } from 'electron'

import type { AppearanceState, IconAppearance } from '../shared/appearance-types'
import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../shared/batch-types'
import type {
  EngineBusy,
  EngineState,
  RunFinishedSummary,
  TaskbarProgressMode
} from '../shared/engine-types'
import { IPC } from '../shared/ipc-channels'
import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type { SetOutputPathResult, SetSimulationTimeoutResult } from '../shared/settings-types'
import type {
  SaveResultResponse,
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '../shared/simulation-types'
import type { UpdateState } from '../shared/update-types'
import { listen, listenToLog } from './listen'

const app = {
  version: () => ipcRenderer.invoke(IPC.app.version),
  reload: () => ipcRenderer.invoke(IPC.app.reload),
  quit: () => ipcRenderer.invoke(IPC.app.quit),
  setDocumentEdited: (edited: boolean) => ipcRenderer.send(IPC.app.setDocumentEdited, edited),
  cpuCount: (): Promise<number> => ipcRenderer.invoke(IPC.app.cpuCount),
  recordError: (reference: string, context: string, details: string) =>
    ipcRenderer.send(IPC.app.recordError, reference, context, details),
  errorLogPath: (): Promise<string> => ipcRenderer.invoke(IPC.app.errorLogPath),
  showErrorLog: (): Promise<boolean> => ipcRenderer.invoke(IPC.app.showErrorLog),
  setProgress: (value: number, mode: TaskbarProgressMode) =>
    ipcRenderer.send(IPC.app.setProgress, value, mode),

  onOpenRunResult: (callback: (summary: RunFinishedSummary) => void) =>
    listen(IPC.app.openRunResult, callback)
}

const runtime = {
  check: (): Promise<RuntimeResult> => ipcRenderer.invoke(IPC.runtime.check),

  update: (packageNames: string[]): Promise<RuntimeResult> =>
    ipcRenderer.invoke(IPC.runtime.update, packageNames),

  onUpdate: (callback: (update: RuntimeUpdate) => void) => listen(IPC.runtime.update, callback),

  onLog: (callback: (line: string) => void) => listenToLog(IPC.runtime.log, callback)
}

const design = {
  setDirty: (dirty: boolean) => ipcRenderer.send(IPC.design.dirty, dirty),

  saveResult: (data: StudyDesign, filePath?: string): Promise<SaveResultResponse> =>
    ipcRenderer.invoke(IPC.design.saveResult, data, filePath),

  loadResult: (): Promise<{ design: StudyDesign; filePath: string } | null> =>
    ipcRenderer.invoke(IPC.design.loadResult),

  onSaveRequested: (callback: () => void) => listen(IPC.design.saveRequested, () => callback()),

  closeConfirmed: () => ipcRenderer.send(IPC.design.closeConfirmed),

  canLeave: (): Promise<boolean | 'save'> => ipcRenderer.invoke(IPC.design.canLeave),

  confirmStopRun: (kind: Exclude<EngineBusy, 'idle'>): Promise<boolean> =>
    ipcRenderer.invoke(IPC.design.confirmStopRun, kind),

  showInFolder: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.design.showInFolder, filePath)
}

const simulation = {
  runSimulation: (input: SimulationRunInput): Promise<SimulationRunResult> =>
    ipcRenderer.invoke(IPC.simulation.run, input),

  cancelSimulation: (): Promise<boolean> => ipcRenderer.invoke(IPC.simulation.cancel),

  onLog: (callback: (line: string) => void) => listenToLog(IPC.simulation.log, callback)
}

const theme = {
  get: (): Promise<AppearanceState> => ipcRenderer.invoke(IPC.theme.get),

  set: (theme: 'system' | 'light' | 'dark'): Promise<AppearanceState> =>
    ipcRenderer.invoke(IPC.theme.set, theme),

  setIconAppearance: (choice: IconAppearance): Promise<AppearanceState> =>
    ipcRenderer.invoke(IPC.theme.setIconAppearance, choice),

  onUpdated: (callback: (theme: AppearanceState) => void) => listen(IPC.theme.updated, callback)
}

const settings = {
  getOutputPath: (): Promise<string> => ipcRenderer.invoke(IPC.settings.getOutputPath),

  setOutputPath: (outputPath: string): Promise<SetOutputPathResult> =>
    ipcRenderer.invoke(IPC.settings.setOutputPath, outputPath),

  selectOutputDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.settings.selectOutputDirectory),

  getSimulationTimeoutMinutes: (): Promise<number> =>
    ipcRenderer.invoke(IPC.settings.getSimulationTimeoutMinutes),

  setSimulationTimeoutMinutes: (minutes: number): Promise<SetSimulationTimeoutResult> =>
    ipcRenderer.invoke(IPC.settings.setSimulationTimeoutMinutes, minutes),

  getNotifyOnRunFinish: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC.settings.getNotifyOnRunFinish),

  setNotifyOnRunFinish: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.settings.setNotifyOnRunFinish, enabled)
}

const batch = {
  run: (inputs: BatchPreparedInput[]): Promise<BatchUpdate> =>
    ipcRenderer.invoke(IPC.batch.run, inputs),

  cancel: (): Promise<boolean> => ipcRenderer.invoke(IPC.batch.cancel),

  onUpdate: (callback: (update: BatchUpdate) => void) => listen(IPC.batch.update, callback),

  onRowDone: (callback: (entry: BatchRunEntry) => void) => listen(IPC.batch.rowDone, callback),

  onLog: (callback: (line: string) => void) => listenToLog(IPC.batch.log, callback)
}

const engine = {
  get: (): Promise<EngineState> => ipcRenderer.invoke(IPC.engine.get),

  onState: (callback: (state: EngineState) => void) => listen(IPC.engine.state, callback)
}

const update = {
  get: (): Promise<UpdateState> => ipcRenderer.invoke(IPC.update.get),

  // `silent` distinguishes the automatic launch check (no "up to
  // date"/error feedback) from a user clicking "Check for Updates".
  check: (silent?: boolean): Promise<void> => ipcRenderer.invoke(IPC.update.check, silent),

  download: (): Promise<void> => ipcRenderer.invoke(IPC.update.download),

  install: (): Promise<void> => ipcRenderer.invoke(IPC.update.install),

  onStatus: (callback: (state: UpdateState) => void) => listen(IPC.update.status, callback)
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
    contextBridge.exposeInMainWorld('update', update)
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
    update: typeof update
  }
}
