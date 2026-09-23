import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, screen, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'

import icon from '../../resources/icon.png?asset'
import { IPC } from '../shared/ipc-channels'
import {
  clearUnsavedDesignChanges,
  hasUnsavedDesignChanges,
  registerAlbatrossFilesIPC
} from './ipc/albatross-files.ipc'
import { registerAppIPC } from './ipc/app.ipc'
import { registerBatchIPC } from './ipc/batch.ipc'
import { registerEngineIPC } from './ipc/engine.ipc'
import { registerRuntimeIPC } from './ipc/runtime.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerSimulationIPC } from './ipc/simulation.ipc'
import { registerThemeIPC } from './ipc/theme.ipc'
import { batchService } from './services/batch.service'
import { settingsService } from './services/settings.service'
import { simulationService } from './services/simulation.service'

let mainWindow: BrowserWindow | null = null
let forceClose = false

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

// These software-rendering switches exist for the headless Docker dev
// environment (see docker-compose.yml: DISPLAY/ELECTRON_DISABLE_GPU/
// LIBGL_ALWAYS_SOFTWARE), where no real GPU is available. They should
// NOT be applied on native installs — forcing swiftshader there just
// disables hardware acceleration for no reason.
const isHeadlessContainer = process.env.ELECTRON_DISABLE_GPU === '1'

if (isHeadlessContainer) {
  app.disableHardwareAcceleration()

  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('disable-gpu-compositing')
  app.commandLine.appendSwitch('disable-gpu-rasterization')
  app.commandLine.appendSwitch('disable-zero-copy')

  app.commandLine.appendSwitch('use-gl', 'swiftshader')
  app.commandLine.appendSwitch('use-angle', 'swiftshader')
  app.commandLine.appendSwitch('enable-unsafe-swiftshader')
}

function createWindow(): void {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const state = settingsService.get('windowState', {
    bounds: {
      width: Math.min(1280, Math.round(workAreaSize.width * 0.8)),
      height: Math.min(800, Math.round(workAreaSize.height * 0.8))
    },
    isMaximized: false
  })
  mainWindow = new BrowserWindow({
    ...state.bounds,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: isHeadlessContainer ? false : true
    }
  })

  if (state.isMaximized) {
    mainWindow?.maximize()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  let saveBoundsTimer: NodeJS.Timeout | null = null

  const persistBounds = (): void => {
    if (!mainWindow?.isMinimized()) {
      settingsService.set('windowState', {
        bounds: mainWindow?.getBounds(),
        isMaximized: mainWindow?.isMaximized()
      })
    }
  }

  const saveBounds = (): void => {
    if (saveBoundsTimer) {
      clearTimeout(saveBoundsTimer)
    }

    saveBoundsTimer = setTimeout(() => {
      persistBounds()
      saveBoundsTimer = null
    }, 300)
  }

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  mainWindow.on('close', async (event) => {
    if (saveBoundsTimer) {
      clearTimeout(saveBoundsTimer)
      saveBoundsTimer = null
      persistBounds()
    }

    if (forceClose) {
      return
    }

    if (!hasUnsavedDesignChanges()) {
      return
    }

    event.preventDefault()

    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: 'Unsaved Design',
      message: 'Your design has unsaved changes.',
      detail: 'Do you want to save before closing?',
      buttons: ['Save', 'Discard', 'Cancel'],
      cancelId: 2
    })

    switch (result.response) {
      case 0:
        mainWindow?.webContents.send(IPC.design.saveRequested)
        break

      case 1:
        clearUnsavedDesignChanges()
        forceClose = true
        mainWindow?.close()
        break
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    forceClose = false
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.albatross.app')

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`Update available: ${info.version}`)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available.')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download: ${progress.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    })

    if (result.response === 0) {
      autoUpdater.quitAndInstall(true, true)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto updater error:', err)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAppIPC()

  registerRuntimeIPC()

  registerSettingsIPC()

  registerAlbatrossFilesIPC()

  registerBatchIPC()

  registerEngineIPC()

  registerSimulationIPC()

  registerThemeIPC()

  ipcMain.on(IPC.design.closeConfirmed, () => {
    clearUnsavedDesignChanges()

    forceClose = true

    mainWindow?.close()
  })

  app.setName('albatross')

  createWindow()

  if (!is.dev) {
    autoUpdater.checkForUpdates()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Kill any in-flight R work before the process exits. Rscript now runs
// detached in its own process group (see RManager.runProcess), so without
// this a running simulation would outlive the app.
app.on('before-quit', () => {
  batchService.cancel()
  simulationService.cancel()
})
