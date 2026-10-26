import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ERROR_REFERENCE_PATTERN } from '../../shared/error-reference'
import { getErrorLogPath, recordError } from './error-log.service'

// Stands in for Electron, so the log is written to a temporary folder.
// (vi.mock is moved above the imports when the test runs.)
const userData = vi.hoisted(() => ({ dir: '' }))
vi.mock('electron', () => ({ app: { getPath: () => userData.dir } }))

function logEntries(): Record<string, string>[] {
  return readFileSync(getErrorLogPath(), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

describe('recordError', () => {
  beforeEach(() => {
    userData.dir = mkdtempSync(path.join(tmpdir(), 'albatross-test-'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    rmSync(userData.dir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  test('writes one JSON line under a new reference', () => {
    const reference = recordError('Saving a design', new Error('disk full'))

    expect(reference).toMatch(ERROR_REFERENCE_PATTERN)
    const [entry] = logEntries()
    expect(entry.reference).toBe(reference)
    expect(entry.context).toBe('Saving a design')
    expect(entry.details).toContain('disk full')
  })

  test('uses the reference it is given', () => {
    expect(recordError('Running R', 'exit code 1', '7F3A-92CD')).toBe('7F3A-92CD')
    expect(logEntries()[0].reference).toBe('7F3A-92CD')
  })

  test('shortens a huge error', () => {
    recordError('Running R', 'x'.repeat(100_000))
    const { details } = logEntries()[0]
    expect(details.length).toBeLessThan(9 * 1024)
    expect(details).toMatch(/\(truncated\)$/)
  })

  test('drops the older half once the log is too large', () => {
    for (let i = 0; i < 60; i++) recordError(`Error ${i}`, 'y'.repeat(8 * 1024))

    expect(statSync(getErrorLogPath()).size).toBeLessThanOrEqual(256 * 1024)
    const entries = logEntries()
    expect(entries.at(-1)?.context).toBe('Error 59')
    expect(entries.some((entry) => entry.context === 'Error 0')).toBe(false)
  })

  test('never throws, even when the log cannot be written', () => {
    // A file where the logs folder should be, so creating the folder fails
    writeFileSync(path.join(userData.dir, 'logs'), '')
    expect(recordError('Saving a design', new Error('disk full'))).toMatch(ERROR_REFERENCE_PATTERN)
  })
})
