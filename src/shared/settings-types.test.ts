import { describe, expect, test } from 'vitest'

import {
  DEFAULT_SIMULATION_TIMEOUT_MINUTES,
  MAX_SIMULATION_TIMEOUT_MINUTES,
  MIN_SIMULATION_TIMEOUT_MINUTES,
  normaliseTimeoutMinutes
} from './settings-types'

describe('normaliseTimeoutMinutes', () => {
  test('keeps a valid timeout, including the limits', () => {
    expect(normaliseTimeoutMinutes(30)).toBe(30)
    expect(normaliseTimeoutMinutes(MIN_SIMULATION_TIMEOUT_MINUTES)).toBe(
      MIN_SIMULATION_TIMEOUT_MINUTES
    )
    expect(normaliseTimeoutMinutes(MAX_SIMULATION_TIMEOUT_MINUTES)).toBe(
      MAX_SIMULATION_TIMEOUT_MINUTES
    )
  })

  test.each([
    ['missing', undefined],
    ['text', 'abc'],
    ['a number as text', '30'],
    ['too short', MIN_SIMULATION_TIMEOUT_MINUTES - 1],
    ['too long', MAX_SIMULATION_TIMEOUT_MINUTES + 1],
    ['a fraction', 30.5],
    ['negative', -5],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY]
  ])('falls back to the default when %s', (_label, value) => {
    expect(normaliseTimeoutMinutes(value)).toBe(DEFAULT_SIMULATION_TIMEOUT_MINUTES)
  })
})
