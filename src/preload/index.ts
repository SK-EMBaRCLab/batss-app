// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { RuntimeResult, RuntimeUpdate } from '../shared/runtime-types'
import type { BatssRunInput, BatssRunResult } from '../shared/batss-types'

const api = {}

const runtime = {
  check: (): Promise<RuntimeResult> => {
    return ipcRenderer.invoke('runtime:check')
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

const batss = {
  runExample: (input: BatssRunInput): Promise<BatssRunResult> => {
    return ipcRenderer.invoke('batss:example', input)
  },

  // Streamed raw R/INLA output from a batss.glm() run, as it happens.
  onLog: (callback: (line: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string): void => {
      callback(line)
    }

    ipcRenderer.on('batss:log', listener)

    return () => {
      ipcRenderer.removeListener('batss:log', listener)
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

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('api', api)

    contextBridge.exposeInMainWorld('runtime', runtime)

    contextBridge.exposeInMainWorld('batss', batss)

    contextBridge.exposeInMainWorld('theme', theme)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI

  // @ts-ignore
  window.api = api

  // @ts-ignore
  window.runtime = runtime

  // @ts-ignore
  window.batss = batss

  // @ts-ignore
  window.theme = theme
}
