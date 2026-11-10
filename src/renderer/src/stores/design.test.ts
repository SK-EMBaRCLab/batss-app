import type { StudyDesign } from '@shared/simulation-types'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { toast } from '@/components/ui/toast'

import { useDesign } from './design'
import { useNavigation } from './navigation'

const DESIGN: StudyDesign = {
  version: 2,
  id: 'design-1',
  name: 'Design',
  createdAt: '2026-10-26T12:00:00.000Z',
  input: { N: 216, m0: 60, m: 12, R: 10, decisionRules: [] },
  results: []
}

beforeEach(() => {
  // Stands in for the preload bridge
  vi.stubGlobal('window', { design: { setDirty: vi.fn() } })
  useDesign.setState({ design: DESIGN, selectedResults: null, selectedResultId: null })
  useNavigation.setState({ currentView: 'dashboard' })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('openResults', () => {
  test('opening one run shows it among all the runs', () => {
    useDesign.getState().openResults(['run-2'])
    expect(useDesign.getState()).toMatchObject({ selectedResults: null, selectedResultId: 'run-2' })
    expect(useNavigation.getState().currentView).toBe('results')
  })

  test('opening several compares them, focused on the last', () => {
    useDesign.getState().openResults(['run-1', 'run-3'])
    expect(useDesign.getState()).toMatchObject({
      selectedResults: ['run-1', 'run-3'],
      selectedResultId: 'run-3'
    })
  })
})

describe('showAllResults', () => {
  test('stops comparing and keeps the run being viewed', () => {
    useDesign.getState().openResults(['run-1', 'run-3'])
    useDesign.getState().showAllResults()
    expect(useDesign.getState()).toMatchObject({ selectedResults: null, selectedResultId: 'run-3' })
  })
})

describe('saveDesign', () => {
  test('a failed save is recorded, and the message gives its reference', async () => {
    const recordError = vi.fn()
    vi.stubGlobal('window', {
      app: { recordError },
      design: {
        setDirty: vi.fn(),
        saveResult: vi.fn(async () => {
          throw new Error('EACCES: permission denied')
        })
      }
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const shown = vi.spyOn(toast, 'add').mockImplementation(() => '')

    expect(await useDesign.getState().saveDesign()).toBe(false)

    const [reference, context, details] = recordError.mock.calls[0]
    expect(context).toBe('design save')
    expect(details).toContain('EACCES: permission denied')
    expect(shown).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        description: expect.stringContaining(reference)
      })
    )
  })
})
