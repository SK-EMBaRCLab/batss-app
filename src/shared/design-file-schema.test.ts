import { describe, expect, test } from 'vitest'

import { parseSimulationRunResult, parseStudyDesignFile } from './design-file-schema'

const INPUT = {
  outcomeType: 'binary',
  probability: 0.3,
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: 1.5,
  N: 200,
  m0: 50,
  m: 25,
  R: 1000,
  corePercent: 50,
  decisionRules: [{ type: 'superiority', direction: 'greater', margin: 0, threshold: 0.95 }]
}

function designFile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 2,
    id: 'design-1',
    name: 'Example design',
    createdAt: '2026-10-26T12:00:00.000Z',
    input: INPUT,
    results: [],
    ...overrides
  }
}

describe('parseStudyDesignFile', () => {
  test('loads a valid design', () => {
    const parsed = parseStudyDesignFile(designFile())
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.input.corePercent).toBe(50)
  })

  test('loads a design whose last run was cancelled', () => {
    const results = [
      {
        id: 'run-1',
        createdAt: '2026-10-26T12:05:00.000Z',
        input: INPUT,
        result: { status: 'cancelled', message: 'Cancelled by user' }
      }
    ]
    expect(parseStudyDesignFile(designFile({ results })).success).toBe(true)
  })

  test('ignores keys added by a newer version of the app', () => {
    const parsed = parseStudyDesignFile(designFile({ addedLater: true }))
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data).not.toHaveProperty('addedLater')
  })

  test('drops an unexpected CPU share instead of rejecting the file', () => {
    const parsed = parseStudyDesignFile(designFile({ input: { ...INPUT, corePercent: 33 } }))
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.input.corePercent).toBeUndefined()
  })

  test('rejects a damaged file and says where the problem is', () => {
    const withoutN: Record<string, unknown> = { ...INPUT }
    delete withoutN.N
    const parsed = parseStudyDesignFile(designFile({ input: withoutN }))
    expect(parsed.success).toBe(false)
    if (!parsed.success)
      expect(parsed.issues.some((issue) => issue.startsWith('input.N:'))).toBe(true)
  })

  test.each([
    ['an older file version', designFile({ version: 1 })],
    ['a list instead of a design', []],
    ['nothing', null]
  ])('rejects %s', (_label, data) => {
    expect(parseStudyDesignFile(data).success).toBe(false)
  })
})

describe('parseSimulationRunResult', () => {
  test('accepts an error result', () => {
    expect(parseSimulationRunResult({ status: 'error', message: 'R failed' })).toEqual({
      status: 'error',
      message: 'R failed'
    })
  })

  test('returns null for anything else', () => {
    expect(parseSimulationRunResult({ status: 'finished' })).toBeNull()
    expect(parseSimulationRunResult('not json')).toBeNull()
  })
})
