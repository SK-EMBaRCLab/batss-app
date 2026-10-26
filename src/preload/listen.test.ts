import { EventEmitter } from 'events'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { listen, listenToLog } from './listen'

// Stands in for Electron's ipcRenderer: emit() plays the part of main
// sending a message. (vi.mock is moved above the imports when the test runs.)
const ipc = vi.hoisted(() => ({ renderer: null as unknown as EventEmitter }))
vi.mock('electron', async () => {
  const { EventEmitter } = await import('events')
  ipc.renderer = new EventEmitter()
  return { ipcRenderer: ipc.renderer }
})

const fromMain = (channel: string, payload?: unknown): void => {
  ipc.renderer.emit(channel, {}, payload)
}

describe('listen', () => {
  beforeEach(() => {
    ipc.renderer.removeAllListeners()
  })

  test('passes each message to the callback', () => {
    const callback = vi.fn()
    listen('update:status', callback)

    fromMain('update:status', { status: 'available' })
    fromMain('update:status', { status: 'downloading' })

    expect(callback.mock.calls).toEqual([[{ status: 'available' }], [{ status: 'downloading' }]])
  })

  test('ignores other channels', () => {
    const callback = vi.fn()
    listen('update:status', callback)

    fromMain('engine:state', { busy: 'idle' })

    expect(callback).not.toHaveBeenCalled()
  })

  test('stops listening when the returned function is called', () => {
    const callback = vi.fn()
    const stop = listen('update:status', callback)

    stop()
    fromMain('update:status', { status: 'available' })

    expect(callback).not.toHaveBeenCalled()
    expect(ipc.renderer.listenerCount('update:status')).toBe(0)
  })
})

describe('listenToLog', () => {
  beforeEach(() => {
    ipc.renderer.removeAllListeners()
  })

  test('hands over a batch of log lines one line at a time', () => {
    const callback = vi.fn()
    listenToLog('simulation:log', callback)

    fromMain('simulation:log', ['Loading BATSS', 'Running 1000 trials'])

    expect(callback.mock.calls).toEqual([['Loading BATSS'], ['Running 1000 trials']])
  })
})
