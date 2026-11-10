import { describe, expect, test } from 'vitest'

import { outcomeModel } from './outcome-model'

describe('outcomeModel', () => {
  test('models binary outcomes as a logistic regression', () => {
    expect(outcomeModel('binary')).toEqual({ family: 'binomial', link: 'logit', varY: 'rbinom' })
  })

  test('models continuous outcomes as a linear regression', () => {
    expect(outcomeModel('continuous')).toEqual({
      family: 'gaussian',
      link: 'identity',
      varY: 'rnorm'
    })
  })

  test('has no model for ordinal outcomes yet', () => {
    expect(outcomeModel('ordinal')).toBeNull()
  })
})
