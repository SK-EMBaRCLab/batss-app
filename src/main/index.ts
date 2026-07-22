import { app, shell, BrowserWindow, ipcMain, screen, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'

import { registerRuntimeIPC } from './ipc/runtime.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { BatssService } from './services/batss.service'
import { settingsService } from './services/settings.service'
import { BatssRunInput } from '../shared/batss-types'

let mainWindow: BrowserWindow | null = null

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

app.disableHardwareAcceleration()

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-rasterization')
app.commandLine.appendSwitch('disable-zero-copy')
app.commandLine.appendSwitch('disable-software-rasterizer', 'false')

app.commandLine.appendSwitch('use-gl', 'swiftshader')
app.commandLine.appendSwitch('use-angle', 'swiftshader')
app.commandLine.appendSwitch('enable-unsafe-swiftshader')

const batssService = new BatssService()

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

    ...(process.platform === 'linux' ? { icon } : {}),

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (state.isMaximized) {
    mainWindow?.maximize()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)

    return {
      action: 'deny'
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const saveBounds = (): void => {
    if (!mainWindow?.isMinimized()) {
      settingsService.set('windowState', {
        bounds: mainWindow?.getBounds(),
        isMaximized: mainWindow?.isMaximized()
      })
    }
  }

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.albatross')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // Runtime bootstrap IPC
  registerRuntimeIPC()

  // Settings IPC (output folder, etc.)
  registerSettingsIPC()

  ipcMain.removeHandler('batss:example')

  ipcMain.handle('batss:example', async (event, input: BatssRunInput) => {
    return await batssService.runExample(input, (line) => {
      event.sender.send('batss:log', line)
    })
  })

  app.setName('albatross')

  ipcMain.handle('theme:get', () => ({
    source: nativeTheme.themeSource,
    dark: nativeTheme.shouldUseDarkColors
  }))

  ipcMain.handle('theme:set', (_event, theme: 'system' | 'light' | 'dark') => {
    nativeTheme.themeSource = theme

    return {
      source: nativeTheme.themeSource,
      dark: nativeTheme.shouldUseDarkColors
    }
  })

  nativeTheme.on('updated', () => {
    const payload = {
      source: nativeTheme.themeSource,
      dark: nativeTheme.shouldUseDarkColors
    }

    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('theme:updated', payload)
    }
  })

  createWindow()

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
