import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type {
  SimulationRunInput,
  SimulationRunResult,
  StudyDesign
} from '../shared/simulation-types'

const api = {}

const app = {
  version: () => ipcRenderer.invoke('app:version'),

  reload: () => ipcRenderer.invoke('app:reload'),

  quit: () => ipcRenderer.invoke('app:quit')
}

const runtime = {
  check: (): Promise<RuntimeResult> => {
    return ipcRenderer.invoke('runtime:check')
  },

  update: (packageNames: string[]): Promise<RuntimeResult> => {
    return ipcRenderer.invoke('runtime:update', packageNames)
  },

  onUpdate: (callback: (update: RuntimeUpdate) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: RuntimeUpdate): void => {
      callback(update)
    }

    ipcRenderer.on('runtime:update', listener)

    return () => {
      ipcRenderer.removeListener('runtime:update', listener)
    }
  },

  // Streamed raw R output (compiler lines, install.packages() progress,
  // etc.), separate from the structured status/progress updates above.
  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => {
      callback(line)
    }

    ipcRenderer.on('runtime:log', listener)

    return () => {
      ipcRenderer.removeListener('runtime:log', listener)
    }
  }
}

const design = {
  setDirty: (dirty: boolean) => {
    ipcRenderer.send('design:dirty', dirty)
  },

  saveResult: (data: StudyDesign): Promise<boolean> =>
    ipcRenderer.invoke('design:saveResult', data),

  loadResult: (): Promise<StudyDesign | null> => {
    return ipcRenderer.invoke('design:loadResult')
  },

  onSaveRequested: (callback: () => void) => {
    const listener = (): void => {
      callback()
    }

    ipcRenderer.on('design:save-requested', listener)

    return () => {
      ipcRenderer.removeListener('design:save-requested', listener)
    }
  },

  closeConfirmed: () => {
    ipcRenderer.send('design:close-confirmed')
  },

  canLeave: (): Promise<boolean | 'save'> => {
    return ipcRenderer.invoke('design:can-leave')
  }
}

const simulation = {
  runSimulation: (input: SimulationRunInput): Promise<SimulationRunResult> => {
    return ipcRenderer.invoke('simulation:run', input)
  },

  // Streamed raw R/INLA output from a batss.glm() run, as it happens.
  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => {
      callback(line)
    }

    ipcRenderer.on('simulation:log', listener)

    return () => {
      ipcRenderer.removeListener('simulation:log', listener)
    }
  }
}

const theme = {
  get: () => ipcRenderer.invoke('theme:get'),

  set: (theme: 'system' | 'light' | 'dark') => ipcRenderer.invoke('theme:set', theme),

  onUpdated: (
    callback: (theme: { source: 'system' | 'light' | 'dark'; dark: boolean }) => void
  ) => {
    const listener = (_: Electron.IpcRendererEvent, payload: any): void => callback(payload)

    ipcRenderer.on('theme:updated', listener)

    return () => {
      ipcRenderer.removeListener('theme:updated', listener)
    }
  }
}

const settings = {
  getOutputPath: (): Promise<string> => {
    return ipcRenderer.invoke('settings:getOutputPath')
  },

  setOutputPath: (outputPath: string): Promise<string> => {
    return ipcRenderer.invoke('settings:setOutputPath', outputPath)
  },

  selectOutputDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke('settings:selectOutputDirectory')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('app', app)

    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('api', api)

    contextBridge.exposeInMainWorld('runtime', runtime)

    contextBridge.exposeInMainWorld('design', design)

    contextBridge.exposeInMainWorld('simulation', simulation)

    contextBridge.exposeInMainWorld('theme', theme)

    contextBridge.exposeInMainWorld('settings', settings)
  } catch (error) {
    console.error(error)
  }
}
