import { describe, expect, test } from 'vitest'

import { stepState } from './stepper-state'

const states = (currentStep: number, reachedStep: number, allowAnyStep = false): string[] =>
  [0, 1, 2, 3, 4].map((index) => {
    const { completed, active, clickable } = stepState(index, {
      currentStep,
      reachedStep,
      allowAnyStep
    })
    if (active) return 'active'
    if (completed) return 'done'
    return clickable ? 'open' : 'locked'
  })

describe('stepState', () => {
  test('a first visit: steps before the current one are done, later ones locked', () => {
    expect(states(2, 2)).toEqual(['done', 'done', 'active', 'locked', 'locked'])
  })

  test('going back keeps the steps already reached clickable', () => {
    expect(states(0, 4)).toEqual(['active', 'done', 'done', 'done', 'open'])
  })

  test('while a run is in progress every step can be clicked', () => {
    expect(states(0, 0, true)).toEqual(['active', 'open', 'open', 'open', 'open'])
  })
})
