import type { MenuItemConstructorOptions } from 'electron'
import { describe, expect, test, vi } from 'vitest'

import { MENU_COMMAND_IDS, type MenuState, toAccelerator } from '../../shared/app-menu'
import { type AppMenuOptions, appMenuTemplate, ISSUES_URL } from './app-menu-template'

type Item = MenuItemConstructorOptions

const ALL_ENABLED: MenuState = {
  hasDesign: true,
  enabled: Object.fromEntries(MENU_COMMAND_IDS.map((id) => [id, true])) as MenuState['enabled']
}

function options(overrides: Partial<AppMenuOptions> = {}): AppMenuOptions {
  return {
    platform: 'darwin',
    isDevelopment: false,
    state: ALL_ENABLED,
    recent: [],
    run: vi.fn(),
    clearRecent: vi.fn(),
    showErrorLog: vi.fn(),
    openUrl: vi.fn(),
    ...overrides
  }
}

const labelOf = (item: Item): string => item.label ?? item.role ?? ''

const menu = (template: Item[], label: string): Item[] => {
  const found = template.find((item) => labelOf(item) === label)
  if (!found) throw new Error(`No ${label} menu`)
  return found.submenu as Item[]
}

const item = (items: Item[], label: string): Item => {
  const found = items.find((candidate) => candidate.label === label)
  if (!found) throw new Error(`No ${label} item`)
  return found
}

// Every role or label in the whole menu, to look for an item anywhere
const everything = (items: Item[]): string[] =>
  items.flatMap((entry) => [
    labelOf(entry),
    ...(Array.isArray(entry.submenu) ? everything(entry.submenu) : [])
  ])

describe('appMenuTemplate', () => {
  test('on macOS, has the app, File, Edit, View, Window and Help menus', () => {
    expect(appMenuTemplate(options()).map(labelOf)).toEqual([
      'BATSS Studio',
      'File',
      'editMenu',
      'View',
      'windowMenu',
      'help'
    ])
  })

  test('on Windows and Linux, puts Settings and Exit in File, and About in Help', () => {
    const template = appMenuTemplate(options({ platform: 'win32' }))
    expect(template.map(labelOf)).toEqual(['File', 'editMenu', 'View', 'help'])
    expect(menu(template, 'File').map(labelOf)).toEqual(
      expect.arrayContaining(['Settings', 'Exit'])
    )
    expect(menu(template, 'help').map(labelOf)).toContain('About BATSS Studio')
  })

  test('has Reload and the developer tools only in a development build', () => {
    expect(everything(appMenuTemplate(options()))).not.toContain('toggleDevTools')
    expect(everything(appMenuTemplate(options()))).not.toContain('reload')

    const development = everything(appMenuTemplate(options({ isDevelopment: true })))
    expect(development).toEqual(expect.arrayContaining(['reload', 'toggleDevTools']))
  })

  test('greys out the commands the app has greyed out, and the pages without a design', () => {
    const state: MenuState = {
      hasDesign: false,
      enabled: { ...ALL_ENABLED.enabled, 'save-design': false }
    }
    const template = appMenuTemplate(options({ state }))
    expect(item(menu(template, 'File'), 'Save').enabled).toBe(false)
    expect(item(menu(template, 'File'), 'New Design').enabled).toBe(true)
    expect(item(menu(template, 'View'), 'Dashboard').enabled).toBe(false)
  })

  test('gives the commands their shortcuts', () => {
    const file = menu(appMenuTemplate(options()), 'File')
    expect(item(file, 'Save').accelerator).toBe('CmdOrCtrl+S')
    expect(item(file, 'Save As…').accelerator).toBe('CmdOrCtrl+Shift+S')
  })

  test('sends a picked command to the window', () => {
    const run = vi.fn()
    const file = menu(appMenuTemplate(options({ run })), 'File')
    item(file, 'Save').click?.({} as never, undefined, {} as never)
    expect(run).toHaveBeenCalledWith({ type: 'command', id: 'save-design' })
  })

  test('lists the recent designs, opened by id, with Clear Recent', () => {
    const run = vi.fn()
    const clearRecent = vi.fn()
    const recent = [{ id: 'r1', name: 'Phase II trial' }]
    const openRecent = item(
      menu(appMenuTemplate(options({ run, clearRecent, recent })), 'File'),
      'Open Recent'
    ).submenu as Item[]

    item(openRecent, 'Phase II trial').click?.({} as never, undefined, {} as never)
    expect(run).toHaveBeenCalledWith({ type: 'open-recent', id: 'r1' })
    item(openRecent, 'Clear Recent').click?.({} as never, undefined, {} as never)
    expect(clearRecent).toHaveBeenCalled()
  })

  test('says so when there are no recent designs', () => {
    const openRecent = item(menu(appMenuTemplate(options()), 'File'), 'Open Recent')
      .submenu as Item[]
    expect(item(openRecent, 'No Recent Designs').enabled).toBe(false)
    expect(item(openRecent, 'Clear Recent').enabled).toBe(false)
  })

  test("opens the GitHub issues page from Help's Report a Problem", () => {
    const openUrl = vi.fn()
    const help = menu(appMenuTemplate(options({ openUrl })), 'help')
    item(help, 'Report a Problem…').click?.({} as never, undefined, {} as never)
    expect(openUrl).toHaveBeenCalledWith(ISSUES_URL)
  })
})

describe('toAccelerator', () => {
  test("turns the palette's shortcuts into Electron's", () => {
    expect(toAccelerator('mod+k')).toBe('CmdOrCtrl+K')
    expect(toAccelerator('mod+shift+s')).toBe('CmdOrCtrl+Shift+S')
    expect(toAccelerator('mod+1')).toBe('CmdOrCtrl+1')
  })
})
