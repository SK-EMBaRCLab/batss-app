import type { SimulationResultEntry } from '@shared/simulation-types'
import { describe, expect, test } from 'vitest'

import { formatRunDate } from '@/lib/run-format'

import { searchText } from './columns'

const ENTRY: SimulationResultEntry = {
  id: 'run-1',
  createdAt: '2026-11-10T20:05:00.000Z',
  input: {
    outcomeType: 'binary',
    probability: 0.3,
    treatmentEffectType: 'oddsRatio',
    treatmentEffect: 1.5,
    N: 216,
    m0: 60,
    m: 12,
    R: 10,
    decisionRules: [{ type: 'superiority', margin: 1, threshold: 0.95 }]
  },
  result: { status: 'error', message: 'R stopped', durationMs: 123_000 }
}

describe('searchText', () => {
  test('holds the values as the table shows them, not as stored', () => {
    const text = searchText(ENTRY)
    expect(text).toContain(formatRunDate(ENTRY.createdAt))
    expect(text).toContain('Odds Ratio')
    expect(text).not.toContain('oddsRatio')
    expect(text).toContain('Error')
    expect(text).toContain('2m 3s')
    expect(text).toContain('0.3')
  })

  test("holds the run's name and notes", () => {
    const text = searchText({ ...ENTRY, name: 'Low burn-in', notes: 'For the grant' })
    expect(text).toContain('Low burn-in')
    expect(text).toContain('For the grant')
  })
})
