import { describe, expect, test } from 'vitest'

import { effectDirection } from './effect-direction'

describe('effectDirection', () => {
  test.each([
    [1.5, 'greater'],
    [1, 'greater'],
    [0.7, 'less']
  ])('an odds ratio of %s is %s', (treatmentEffect, direction) => {
    expect(effectDirection({ outcomeType: 'binary', treatmentEffect })).toBe(direction)
  })

  test.each([
    [3, 'greater'],
    [0, 'greater'],
    [-3, 'less']
  ])('a mean difference of %s is %s', (meanDiff, direction) => {
    expect(effectDirection({ outcomeType: 'continuous', meanDiff })).toBe(direction)
  })

  test('reads typed text', () => {
    expect(effectDirection({ outcomeType: 'binary', treatmentEffect: '0.8' })).toBe('less')
    expect(effectDirection({ outcomeType: 'continuous', meanDiff: ' -2 ' })).toBe('less')
  })

  test('counts an effect not entered yet as greater', () => {
    expect(effectDirection({ outcomeType: 'binary', treatmentEffect: '' })).toBe('greater')
    expect(effectDirection({ outcomeType: 'continuous' })).toBe('greater')
    expect(effectDirection({})).toBe('greater')
  })
})
