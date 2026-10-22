/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type -- Plain JavaScript Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve, dirname } = require('node:path')
const { EventEmitter } = require('node:events')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

function setup(saved = {}, platform = 'darwin') {
  const handlers = new Map()
  const icons = []
  const messages = []
  const settings = { ...saved }
  const nativeTheme = new EventEmitter()
  nativeTheme.themeSource = 'system'
  nativeTheme.osDark = false
  Object.defineProperty(nativeTheme, 'shouldUseDarkColors', {
    get: () =>
      nativeTheme.themeSource === 'dark' ||
      (nativeTheme.themeSource === 'system' && nativeTheme.osDark)
  })
  const live = { webContents: { isDestroyed: () => false, send: (...args) => messages.push(args) } }
  const destroyed = {
    webContents: { isDestroyed: () => true, send: () => assert.fail('Destroyed window') }
  }
  const electron = {
    app: { dock: { setIcon: (path) => icons.push(path) } },
    nativeTheme,
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    BrowserWindow: { getAllWindows: () => [live, destroyed] }
  }
  const settingsService = {
    get: (key, fallback) => settings[key] ?? fallback,
    set: (key, value) => {
      settings[key] = value
    }
  }
  function load(filename) {
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText
    const module = { exports: {} }
    const customRequire = (name) => {
      if (name === 'electron') return electron
      if (name.endsWith('?asset')) return { __esModule: true, default: name }
      if (name.endsWith('settings.service')) return { settingsService }
      return load(resolve(dirname(filename), name + '.ts'))
    }
    vm.runInNewContext(output, {
      module,
      exports: module.exports,
      require: customRequire,
      process: { platform }
    })
    return module.exports
  }
  load(resolve(__dirname, '../src/main/ipc/theme.ipc.ts')).registerThemeIPC()
  const call = (name, value) => handlers.get(name)(null, value)
  return { call, settings, icons, messages, nativeTheme, settingsService }
}

test('defaults to the effective theme at startup and follows OS appearance changes', () => {
  const s = setup()
  assert.match(s.icons.at(-1), /icon-light.png/)
  s.nativeTheme.osDark = true
  s.nativeTheme.emit('updated')
  assert.match(s.icons.at(-1), /icon-dark.png/)
  assert.equal(s.messages.at(-1)[1].dark, true)
})

test('explicit app theme changes update the Dock immediately and persist', () => {
  const s = setup()
  s.call('theme:set', 'dark')
  assert.equal(s.settings.themeSource, 'dark')
  assert.match(s.icons.at(-1), /icon-dark.png/)
  s.call('theme:set', 'light')
  assert.match(s.icons.at(-1), /icon-light.png/)
})

test('all fixed icons override theme changes until Follow theme is restored', () => {
  const s = setup()
  for (const [choice, filename] of [
    ['brand', 'icon.png'],
    ['light', 'icon-light.png'],
    ['dark', 'icon-dark.png']
  ]) {
    s.call('theme:set-icon-appearance', choice)
    s.call('theme:set', 'dark')
    assert.ok(s.icons.at(-1).endsWith(filename + '?asset'))
    assert.equal(s.settings.iconAppearance, choice)
  }
  s.call('theme:set', 'light')
  s.call('theme:set-icon-appearance', 'theme')
  assert.match(s.icons.at(-1), /icon-light.png/)
})

test('saved preferences restore at startup', () => {
  const s = setup({ themeSource: 'dark', iconAppearance: 'light' })
  assert.equal(s.call('theme:get').source, 'dark')
  assert.equal(s.call('theme:get').iconAppearance, 'light')
  assert.match(s.icons.at(-1), /icon-light.png/)
})

test('invalid persisted preferences fall back safely and IPC rejects invalid input', () => {
  const s = setup({ themeSource: 'invalid', iconAppearance: '../../arbitrary.png' })
  assert.equal(s.call('theme:get').iconAppearance, 'theme')
  assert.equal(s.call('theme:get').source, 'system')
  assert.throws(() => s.call('theme:set', 'invalid'), /Invalid theme/)
  assert.throws(() => s.call('theme:set-icon-appearance', '/tmp/evil.png'), /Invalid icon/)
})

test('failed preference saves leave the current icon unchanged', () => {
  const s = setup()
  const count = s.icons.length
  s.settingsService.set = () => {
    throw new Error('Disk full')
  }
  assert.throws(() => s.call('theme:set-icon-appearance', 'dark'), /Disk full/)
  assert.equal(s.call('theme:get').iconAppearance, 'theme')
  assert.equal(s.icons.length, count)
})

test('other platforms publish the preference without accessing the macOS Dock', () => {
  for (const platform of ['win32', 'linux']) {
    const s = setup({}, platform)
    s.call('theme:set-icon-appearance', 'dark')
    assert.equal(s.icons.length, 0)
    assert.equal(s.messages.at(-1)[1].iconAppearance, 'dark')
  }
})
