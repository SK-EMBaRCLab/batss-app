import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { spawn } from 'child_process'
import { app, BrowserWindow, dialog, ipcMain, screen, session, shell } from 'electron'
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
import { registerUpdateIPC } from './ipc/update.ipc'
import { rManager } from './runtime/r-manager'
import { batchService } from './services/batch.service'
import { settingsService } from './services/settings.service'
import { simulationService } from './services/simulation.service'

let mainWindow: BrowserWindow | null = null
let forceClose = false

// These software-rendering switches exist for the headless Docker dev
// environment (see docker-compose.yml: DISPLAY/ELECTRON_DISABLE_GPU/
// LIBGL_ALWAYS_SOFTWARE), where no real GPU is available. They should
// NOT be applied on native installs — forcing swiftshader there just
// disables hardware acceleration for no reason.
const isHeadlessContainer = process.env.ELECTRON_DISABLE_GPU === '1'

// Electron 38+ defaults to Wayland on Linux, and the
// ELECTRON_OZONE_PLATFORM_HINT env var that used to force X11 was
// removed in that same release. Forcing X11 via
// app.commandLine.appendSwitch() alone isn't reliably honored by the
// GPU process on every Wayland setup — what actually works is a real
// `--ozone-platform=x11` process argument, the same as launching with
// `./Albatross.AppImage --ozone-platform=x11` by hand. That matters
// here because electron-updater's AppImage restart
// (AppImageUpdater.doInstall, in electron-updater) always relaunches
// with an empty argv, silently dropping that flag and breaking
// "Restart & Install" on Linux. Rather than requiring users to pass
// the flag manually (or patching electron-updater), self-relaunch
// once with it baked into real argv whenever it's missing — this
// covers a plain launch and the post-update restart the same way.
const OZONE_X11_FLAG = '--ozone-platform=x11'

// Guards the real startup further down (app.whenReady()/app.on(...))
// so this process does nothing but bridge to the relaunched one.
let isRelaunching = false

if (
  process.platform === 'linux' &&
  !isHeadlessContainer &&
  !process.argv.includes(OZONE_X11_FLAG)
) {
  isRelaunching = true

  // Deliberately relaunch process.execPath (the binary already
  // running out of this session's FUSE mount) rather than re-exec'ing
  // process.env.APPIMAGE — launching the .AppImage file again forces
  // a brand new FUSE mount, which fails outright on systems where
  // mounting is restricted outside of a normal interactive launch
  // (e.g. AppArmor's unprivileged-userns restrictions on newer
  // Ubuntu).
  //
  // Spawning it ourselves (rather than app.relaunch(), which is
  // fire-and-forget) and delaying app.exit() a moment matters for the
  // same FUSE mount: an AppImage's mount isn't guaranteed to outlive
  // the process that first launched it, so exiting immediately (as
  // app.relaunch() + app.exit(0) does) risked killing this process —
  // and whatever owns the mount along with it — before the new
  // process had even finished loading its native modules and reading
  // resources out of the mounted app bundle. That race is what caused
  // the self-relaunch to silently produce no window at all instead of
  // an error. Giving it a couple of seconds to get going first trades
  // a slightly slower launch for an actually-reliable one.
  const relaunched = spawn(process.execPath, [...process.argv.slice(1), OZONE_X11_FLAG], {
    detached: true,
    stdio: 'ignore'
  })
  relaunched.unref()

  setTimeout(() => app.exit(0), 2000)
} else if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

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
    // Below this the sidebar plus the wider pages (e.g. Simulation Runs)
    // stop fitting comfortably
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // Off only for the Docker dev container, never in a packaged build:
      // ELECTRON_DISABLE_GPU is an env var anyone could set
      sandbox: !(isHeadlessContainer && !app.isPackaged)
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
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {})
    return { action: 'deny' }
  })

  // The app is a single page, so the window itself never needs to load a
  // different one. Block that (e.g. a link without target="_blank", or a
  // URL dropped on the window) so no other page can get the preload API;
  // web links open in the browser instead.
  mainWindow.webContents.on('will-navigate', (details) => {
    if (details.isSameDocument) return
    details.preventDefault()
    if (/^https?:\/\//i.test(details.url)) shell.openExternal(details.url).catch(() => {})
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

// Skipped entirely while isRelaunching: this process is just a brief
// bridge keeping the AppImage's FUSE mount alive for the relaunched
// instance above (see the ozone-platform block) — it should never
// open its own window or register IPC handlers that'd fight with the
// real instance for the same resources.
if (!isRelaunching) {
  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.albatross.app')

    // Electron grants most web permissions (camera, microphone, location,
    // ...) by default. Albatross needs none of them; notifications come
    // from main. Clipboard writes are the one exception, for the "Copy
    // details" buttons.
    const allowPermission = (permission: string): boolean =>
      permission === 'clipboard-sanitized-write'
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) =>
      callback(allowPermission(permission))
    )
    session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
      allowPermission(permission)
    )

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

    registerUpdateIPC()

    ipcMain.on(IPC.design.closeConfirmed, () => {
      clearUnsavedDesignChanges()

      forceClose = true

      mainWindow?.close()
    })

    app.setName('albatross')

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

  // Kill any in-flight R work before the process exits. Rscript now runs
  // detached in its own process group (see RManager.runProcess), so without
  // this a running simulation would outlive the app. Forced straight away:
  // the app won't be around for the usual grace period after a cancel.
  app.on('before-quit', () => {
    batchService.cancel()
    simulationService.cancel()
    rManager.killAll()
  })
}
