import { describe, expect, test } from 'vitest'

import { firstInvalidStep } from './utils'

describe('firstInvalidStep', () => {
  const validExcept =
    (...invalid: number[]) =>
    (index: number): boolean =>
      !invalid.includes(index)

  test('is null when every step passed on the way is fine', () => {
    expect(firstInvalidStep(0, 4, validExcept())).toBeNull()
  })

  test('stops a jump forward at the first step with problems', () => {
    expect(firstInvalidStep(0, 4, validExcept(1, 3))).toBe(1)
  })

  test('does not check the step being jumped to', () => {
    expect(firstInvalidStep(1, 3, validExcept(3))).toBeNull()
  })

  test('checks nothing when not moving forward', () => {
    expect(firstInvalidStep(2, 2, validExcept(2))).toBeNull()
  })
})
