import { expect, test, vi } from 'vitest'

import type { UpdateState } from '../../../shared/update-types'
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
