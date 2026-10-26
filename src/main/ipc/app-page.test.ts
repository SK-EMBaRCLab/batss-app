import { describe, expect, test } from 'vitest'

import { matchesAppPage } from './app-page'

const MAC_PAGE = 'file:///Users/sam/Albatross%20App/out/renderer/index.html'
const WINDOWS_PAGE =
  'file:///C:/Program%20Files/Albatross/resources/app.asar/out/renderer/index.html'

describe('matchesAppPage', () => {
  test('accepts the bundled page', () => {
    expect(matchesAppPage(MAC_PAGE, MAC_PAGE, undefined, false)).toBe(true)
  })

  test('accepts the bundled page whether spaces are encoded or not', () => {
    const unencoded = 'file:///Users/sam/Albatross App/out/renderer/index.html'
    expect(matchesAppPage(unencoded, MAC_PAGE, undefined, false)).toBe(true)
  })

  test('ignores letter case on Windows only', () => {
    const lowerCase = WINDOWS_PAGE.replace('C:/Program%20Files', 'c:/program files')
    expect(matchesAppPage(lowerCase, WINDOWS_PAGE, undefined, true)).toBe(true)
    expect(matchesAppPage(lowerCase, WINDOWS_PAGE, undefined, false)).toBe(false)
  })

  test('refuses another file on disk', () => {
    const other = 'file:///Users/sam/Downloads/index.html'
    expect(matchesAppPage(other, MAC_PAGE, undefined, false)).toBe(false)
  })

  test('refuses a website', () => {
    expect(matchesAppPage('https://example.com/index.html', MAC_PAGE, undefined, false)).toBe(false)
  })

  test('refuses something that is not a URL', () => {
    expect(matchesAppPage('not a url', MAC_PAGE, undefined, false)).toBe(false)
  })

  describe('in development', () => {
    const devUrl = 'http://localhost:5173'

    test('accepts any page on the dev server', () => {
      expect(matchesAppPage('http://localhost:5173/#/settings', MAC_PAGE, devUrl)).toBe(true)
    })

    test('refuses another port or the bundled page', () => {
      expect(matchesAppPage('http://localhost:5174/', MAC_PAGE, devUrl)).toBe(false)
      expect(matchesAppPage(MAC_PAGE, MAC_PAGE, devUrl)).toBe(false)
    })
  })
})
