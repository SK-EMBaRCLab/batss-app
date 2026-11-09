import * as fs from 'fs'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { migrateLegacyDataFolder } from './app-paths'

// Stands in for Electron: the error log (written on failure) goes to the
// new data folder inside the temporary appData folder.
// (vi.mock is moved above the imports when the test runs.)
const appData = vi.hoisted(() => ({ dir: '' }))
vi.mock('electron', () => ({
  app: { getPath: () => path.join(appData.dir, 'BATSS Studio') }
}))

// The real renameSync, but replaceable per test to simulate a failure
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, renameSync: vi.fn(actual.renameSync) }
})

const legacy = (): string => path.join(appData.dir, 'albatross')
const current = (): string => path.join(appData.dir, 'BATSS Studio')

describe('migrateLegacyDataFolder', () => {
  beforeEach(() => {
    appData.dir = mkdtempSync(path.join(tmpdir(), 'batss-studio-test-'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    rmSync(appData.dir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  test('moves the old folder and everything in it', () => {
    mkdirSync(path.join(legacy(), 'R-library', 'INLA'), { recursive: true })
    writeFileSync(path.join(legacy(), 'settings.json'), '{"theme":"dark"}')

    expect(migrateLegacyDataFolder(appData.dir)).toBe('moved')

    expect(existsSync(legacy())).toBe(false)
    expect(readFileSync(path.join(current(), 'settings.json'), 'utf8')).toBe('{"theme":"dark"}')
    expect(existsSync(path.join(current(), 'R-library', 'INLA'))).toBe(true)
  })

  test('does nothing on a later launch, once the new folder exists', () => {
    mkdirSync(legacy())
    mkdirSync(current())

    expect(migrateLegacyDataFolder(appData.dir)).toBe('skipped')
    expect(existsSync(legacy())).toBe(true)
  })

  test('does nothing on a fresh install with no old folder', () => {
    expect(migrateLegacyDataFolder(appData.dir)).toBe('skipped')
    expect(existsSync(current())).toBe(false)
  })

  test('logs and carries on if the move fails, leaving the old folder alone', () => {
    mkdirSync(legacy())
    vi.mocked(fs.renameSync).mockImplementationOnce(() => {
      throw new Error('EBUSY: resource busy or locked')
    })

    expect(migrateLegacyDataFolder(appData.dir)).toBe('failed')

    expect(existsSync(legacy())).toBe(true)
    const log = readFileSync(path.join(current(), 'logs', 'errors.log'), 'utf8')
    expect(log).toContain('Moving the Albatross data folder')
    expect(log).toContain('EBUSY')
  })
})
