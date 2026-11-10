import { describe, expect, test } from 'vitest'

import { shownErrors } from './step-errors'

describe('shownErrors', () => {
  const errors: [string] = ['Maximum sample size must be a number.']

  test('hides errors on a field nobody has touched on a step not yet tried', () => {
    expect(shownErrors(errors, false, false)).toBeNull()
  })

  test('shows them once the field is touched or Next is tried on its step', () => {
    expect(shownErrors(errors, true, false)).toBe(errors)
    expect(shownErrors(errors, false, true)).toBe(errors)
  })

  test('shows nothing when there are no errors', () => {
    expect(shownErrors(null, true, true)).toBeNull()
  })
})
