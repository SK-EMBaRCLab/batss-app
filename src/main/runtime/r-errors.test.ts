import { describe, expect, test } from 'vitest'

import { abortErrorFrom, RAbortedError, RCancelledError, RTimeoutError } from './r-errors'

describe('abortErrorFrom', () => {
  test('keeps a timeout a timeout, with its message', () => {
    const error = abortErrorFrom(new RTimeoutError(90_000))
    expect(error).toBeInstanceOf(RTimeoutError)
    expect(error.message).toBe('R process timed out after 90s')
  })

  test('keeps a cancel a cancel, with its message', () => {
    const error = abortErrorFrom(new RCancelledError('Batch cancelled by user'))
    expect(error).toBeInstanceOf(RCancelledError)
    expect(error.message).toBe('Batch cancelled by user')
  })

  test('counts any other reason as a cancel, worded for any R task', () => {
    for (const reason of [undefined, 'stop', new Error('Simulation cancelled by user')]) {
      const error = abortErrorFrom(reason)
      expect(error).toBeInstanceOf(RCancelledError)
      expect(error.message).toBe('R process was cancelled')
    }
  })

  test('both count as aborted, under the standard name', () => {
    for (const error of [new RCancelledError('x'), new RTimeoutError(1000)]) {
      expect(error).toBeInstanceOf(RAbortedError)
      expect(error.name).toBe('AbortError')
    }
    expect(new RCancelledError('x')).not.toBeInstanceOf(RTimeoutError)
  })
})
