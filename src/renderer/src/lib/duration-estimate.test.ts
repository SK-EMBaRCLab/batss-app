import { describe, expect, test } from 'vitest'

import { estimateSimulationDuration } from './duration-estimate'

// The Review step's calculation: ~5 seconds per interim analysis, times
// (N - m0) / m interim analyses, times R trials, doubled for the target
// and null effects, divided across the cores in use
describe('estimateSimulationDuration', () => {
  test("matches the Review step's calculation", () => {
    const estimate = estimateSimulationDuration({
      N: 216,
      m0: 60,
      m: 12,
      R: 10,
      corePercent: 100,
      cpuCount: 4
    })
    // 5 × 13 × 10 × 2 ÷ 4
    expect(estimate?.seconds).toBe(325)
  })

  test('reads typed text like the form holds', () => {
    const estimate = estimateSimulationDuration({
      N: '216',
      m0: '60',
      m: '12',
      R: '1',
      corePercent: 100,
      cpuCount: 8
    })
    // R caps the cores at 1: 5 × 13 × 1 × 2
    expect(estimate?.seconds).toBe(130)
  })

  test('is null until the sample sizes are filled in', () => {
    expect(estimateSimulationDuration({ N: 216, m0: 60, m: 12, cpuCount: 4 })).toBeNull()
    expect(estimateSimulationDuration({ N: 60, m0: 60, m: 12, R: 10, cpuCount: 4 })).toBeNull()
  })
})
