import { describe, expect, test } from 'vitest'

import { runExportFileName } from './download'

describe('runExportFileName', () => {
  // A local time, so the test reads the same in any time zone
  const createdAt = new Date(2026, 10, 10, 15, 5).toISOString()

  test("names the design, what it is and the run's date", () => {
    expect(runExportFileName('My trial', 'chart', createdAt, 'png')).toBe(
      'My trial – chart – 2026-11-10.png'
    )
  })

  test('drops characters a file name cannot hold', () => {
    expect(runExportFileName('A/B: "v2"?', 'chart', createdAt, 'png')).toBe(
      'A B v2 – chart – 2026-11-10.png'
    )
    expect(runExportFileName('  ', 'chart', createdAt, 'png')).toBe(
      'Design – chart – 2026-11-10.png'
    )
  })
})
