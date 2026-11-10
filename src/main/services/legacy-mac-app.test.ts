import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { findLegacyApp, legacyAppCandidates } from './legacy-mac-app'

// Only the bundle lookup is tested, which doesn't use Electron
vi.mock('electron', () => ({ app: {}, dialog: {}, shell: {} }))
vi.mock('./settings.service', () => ({ settingsService: {} }))
vi.mock('./error-log.service', () => ({ recordError: vi.fn() }))

let dir = ''

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'legacy-mac-app-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** A minimal app bundle with the given identifier in its Info.plist. */
function bundle(name: string, identifier: string): string {
  const bundlePath = path.join(dir, name)
  mkdirSync(path.join(bundlePath, 'Contents'), { recursive: true })
  writeFileSync(
    path.join(bundlePath, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${identifier}</string>
</dict>
</plist>`
  )
  return bundlePath
}

describe('findLegacyApp', () => {
  test('finds the old Albatross bundle', () => {
    const albatross = bundle('albatross.app', 'com.albatross.app')
    expect(findLegacyApp([path.join(dir, 'missing.app'), albatross])).toBe(albatross)
  })

  test('leaves an unrelated app with the same name alone', () => {
    const other = bundle('albatross.app', 'org.example.albatross')
    expect(findLegacyApp([other])).toBeNull()
  })

  test('is null when nothing is installed or the bundle has no Info.plist', () => {
    mkdirSync(path.join(dir, 'empty.app'))
    expect(findLegacyApp([path.join(dir, 'missing.app'), path.join(dir, 'empty.app')])).toBeNull()
  })
})

describe('legacyAppCandidates', () => {
  test('looks in the system and the user Applications folders', () => {
    expect(legacyAppCandidates('/Users/someone')).toEqual([
      '/Applications/albatross.app',
      '/Users/someone/Applications/albatross.app'
    ])
  })
})
