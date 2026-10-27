import { describe, expect, test, vi } from 'vitest'

import { findDiskImage } from './mac-update'

// Only finding the download is tested; downloading needs Electron's network
vi.mock('electron', () => ({}))

// As in v5.7.5's latest-mac.yml, before the .zip was dropped
const RELEASE = {
  version: '5.7.5',
  files: [
    { url: 'albatross-5.7.5-arm64-mac.zip', sha512: 'zip-hash', size: 145814839 },
    { url: 'albatross-5.7.5.dmg', sha512: 'dmg-hash', size: 145922045 }
  ]
}

describe('findDiskImage', () => {
  test("picks the release's .dmg and its GitHub download address", () => {
    expect(findDiskImage(RELEASE)).toEqual({
      fileName: 'albatross-5.7.5.dmg',
      url: 'https://github.com/SK-EMBaRCLab/batss-app/releases/download/v5.7.5/albatross-5.7.5.dmg',
      sha512: 'dmg-hash',
      size: 145922045
    })
  })

  test('finds nothing in a release without a .dmg', () => {
    expect(findDiskImage({ ...RELEASE, files: [RELEASE.files[0]] })).toBeNull()
  })

  test('ignores a .dmg entry that is a path or address rather than a file name', () => {
    for (const url of ['../albatross.dmg', 'https://example.com/albatross.dmg']) {
      expect(findDiskImage({ version: '5.7.5', files: [{ url, sha512: 'x' }] })).toBeNull()
    }
  })
})
