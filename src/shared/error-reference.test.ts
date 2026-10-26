import { describe, expect, test } from 'vitest'

import { createErrorReference, ERROR_REFERENCE_PATTERN, withReference } from './error-reference'

describe('createErrorReference', () => {
  test('looks like "7F3A-92CD"', () => {
    for (let i = 0; i < 100; i++) {
      expect(createErrorReference()).toMatch(ERROR_REFERENCE_PATTERN)
    }
  })

  test('gives a different reference each time', () => {
    const references = new Set(Array.from({ length: 100 }, createErrorReference))
    expect(references.size).toBe(100)
  })
})

describe('withReference', () => {
  test('appends the reference to the message', () => {
    expect(withReference('Something went wrong.', '7F3A-92CD')).toBe(
      'Something went wrong. Reference: 7F3A-92CD'
    )
  })
})
