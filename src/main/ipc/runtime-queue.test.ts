import { describe, expect, test } from 'vitest'

import type { RuntimeResult } from '../runtime/types'
import { runExclusive } from './runtime-queue'

const RESULT: RuntimeResult = { ready: true, r: true, packages: [] }

/** A run that only finishes when the test says so (even if it hasn't started yet). */
function controlledRun(): {
  start: () => Promise<RuntimeResult>
  finish: () => void
  started: () => boolean
} {
  const { promise, resolve } = Promise.withResolvers<RuntimeResult>()
  let hasStarted = false
  return {
    start: () => {
      hasStarted = true
      return promise
    },
    finish: () => resolve(RESULT),
    started: () => hasStarted
  }
}

// Lets queued promise callbacks run
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0))

describe('runExclusive', () => {
  test('overlapping checks share one run', async () => {
    const first = controlledRun()
    const second = controlledRun()

    const a = runExclusive('check', first.start)
    const b = runExclusive('check', second.start)
    first.finish()

    expect(await a).toBe(RESULT)
    expect(await b).toBe(RESULT)
    expect(second.started()).toBe(false)
  })

  test('an update waits for a running check, then runs itself', async () => {
    const check = controlledRun()
    const update = controlledRun()

    const checkDone = runExclusive('check', check.start)
    const updateDone = runExclusive('update', update.start)
    await settle()
    expect(update.started()).toBe(false)

    check.finish()
    await checkDone
    await settle()
    expect(update.started()).toBe(true)

    update.finish()
    await updateDone
  })

  test('a failed run does not block the next one', async () => {
    const failing = runExclusive('update', () => Promise.reject(new Error('R crashed')))
    const next = runExclusive('check', () => Promise.resolve(RESULT))

    await expect(failing).rejects.toThrow('R crashed')
    expect(await next).toBe(RESULT)
  })

  test('a check after the previous one finished starts a new run', async () => {
    await runExclusive('check', () => Promise.resolve(RESULT))
    await settle()

    const later = controlledRun()
    const done = runExclusive('check', later.start)
    await settle()
    expect(later.started()).toBe(true)

    later.finish()
    await done
  })
})
