import type { UpdateState } from '@shared/update-types'
import { afterEach, expect, test, vi } from 'vitest'

import { useUpdate } from './update'

test('update messages from the main process reach the store', async () => {
  // Stands in for the preload bridge; the test can push a message through it
  let push: (state: UpdateState) => void = () => undefined
  vi.stubGlobal('window', {
    update: {
      get: async (): Promise<UpdateState> => ({ status: 'idle', message: '' }),
      check: async (): Promise<void> => undefined,
      onStatus: (callback: (state: UpdateState) => void) => {
        push = callback
        return () => undefined
      }
    }
  })

  await useUpdate.getState().initialize()
  push({ status: 'available', message: 'Update 5.7.3 available', version: '5.7.3', silent: true })

  // Like an installed app, the test has no import.meta.hot, so this catches
  // a subscription that only happens in development
  expect(useUpdate.getState().status).toBe('available')
  expect(useUpdate.getState().version).toBe('5.7.3')

  vi.unstubAllGlobals()
})

/** Stands in for the preload bridge; returns a way to push a state and to answer get(). */
function bridge(): {
  push: (state: UpdateState) => void
  answer: (state: UpdateState) => void
} {
  let push: (state: UpdateState) => void = () => undefined
  let answer: (state: UpdateState) => void = () => undefined
  vi.stubGlobal('window', {
    update: {
      get: () => new Promise<UpdateState>((resolve) => (answer = resolve)),
      check: async (): Promise<void> => undefined,
      onStatus: (callback: (state: UpdateState) => void) => {
        push = callback
        return () => undefined
      }
    }
  })
  return { push: (state) => push(state), answer: (state) => answer(state) }
}

afterEach(() => {
  vi.unstubAllGlobals()
  useUpdate.setState({ initialized: false, status: 'idle', message: '', error: undefined })
})

test('each state from main replaces the last, rather than keeping its fields', async () => {
  const main = bridge()
  const ready = useUpdate.getState().initialize()
  main.answer({ status: 'idle', message: '' })
  await ready

  main.push({ status: 'error', message: 'Update check failed', error: 'offline', version: '6.0.1' })
  main.push({ status: 'checking', message: 'Checking for updates…' })

  const state = useUpdate.getState()
  expect(state.status).toBe('checking')
  expect(state.error).toBeUndefined()
  expect(state.version).toBeUndefined()
})

test('the opening snapshot never overwrites a newer state pushed meanwhile', async () => {
  const main = bridge()
  const ready = useUpdate.getState().initialize()

  main.push({ status: 'available', message: 'Update 6.0.1 available', version: '6.0.1' })
  main.answer({ status: 'idle', message: '' })
  await ready

  expect(useUpdate.getState().status).toBe('available')
})
