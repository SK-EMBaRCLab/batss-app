import { describe, expect, test } from 'vitest'

import { appendLogs, subscribeLogs } from './log-buffer'

describe('appendLogs', () => {
  test('keeps only the newest lines', () => {
    expect(appendLogs(['a', 'b'], ['c', 'd'], 3)).toEqual(['b', 'c', 'd'])
    expect(appendLogs([], ['a'], 3)).toEqual(['a'])
  })
})

describe('subscribeLogs', () => {
  test('appends each batch from main as it arrives, until stopped', () => {
    let send: (lines: string[]) => void = () => undefined
    let listening = false
    const onLog = (callback: (lines: string[]) => void): (() => void) => {
      send = callback
      listening = true
      return () => {
        listening = false
      }
    }

    const received: string[][] = []
    const stop = subscribeLogs(onLog, (lines) => received.push(lines))

    send(['Starting'])
    send(['Fitting', 'Results'])
    // Applied straight away, so a run's next event always sees them
    expect(received).toEqual([['Starting'], ['Fitting', 'Results']])

    stop()
    expect(listening).toBe(false)
  })
})
