import { MAX_DESIGN_DESCRIPTION_LENGTH } from '@shared/design-rules'
import type { SimulationResultEntry, StudyDesign } from '@shared/simulation-types'
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

/** A finished run, as the design keeps it. */
function run(id: string): SimulationResultEntry {
  return {
    id,
    createdAt: '2026-11-10T15:05:00.000Z',
    input: {
      outcomeType: 'continuous',
      meanOutcome: 10,
      sd: 2.5,
      meanDiff: 3,
      N: 216,
      m0: 60,
      m: 12,
      R: 10,
      decisionRules: [{ type: 'superiority', margin: 0, threshold: 0.95 }]
    },
    result: { status: 'error', message: 'R stopped' }
  }
}

const ids = (): string[] => useDesign.getState().design!.results.map((entry) => entry.id)

describe('editResult', () => {
  test("sets a run's name and notes, trimmed, and marks the design changed", () => {
    useDesign.setState({ design: { ...DESIGN, results: [run('a'), run('b')] }, isDirty: false })

    useDesign.getState().editResult('b', { name: '  Baseline  ', notes: 'For the protocol' })

    const [a, b] = useDesign.getState().design!.results
    expect(b).toMatchObject({ name: 'Baseline', notes: 'For the protocol' })
    expect(a.name).toBeUndefined()
    expect(useDesign.getState().isDirty).toBe(true)
  })

  test('empty text clears a name, and leaves what was not given alone', () => {
    useDesign.setState({
      design: { ...DESIGN, results: [{ ...run('a'), name: 'Old', notes: 'Kept' }] }
    })

    useDesign.getState().editResult('a', { name: '   ' })

    expect(useDesign.getState().design!.results[0]).toMatchObject({
      name: undefined,
      notes: 'Kept'
    })
  })
})

describe('startFromRun', () => {
  test("opens the wizard with the run's settings, without changing the design", () => {
    useDesign.setState({
      design: { ...DESIGN, results: [run('a'), { ...run('b'), name: 'Baseline' }] },
      isDirty: false,
      startFrom: null
    })

    useDesign.getState().startFromRun('b')

    const { startFrom, design, isDirty } = useDesign.getState()
    expect(startFrom).toMatchObject({
      runId: 'b',
      input: { outcomeType: 'continuous', meanDiff: 3, corePercent: 75 }
    })
    expect(startFrom?.runLabel).toMatch(/\(Baseline\)$/)
    expect(design!.input).toEqual(DESIGN.input)
    expect(isDirty).toBe(false)
    expect(useNavigation.getState().currentView).toBe('simulation')
  })

  test('clearStartFrom goes back to the design settings, and a new starting point refills the wizard', () => {
    useDesign.setState({ design: { ...DESIGN, results: [run('a')] }, startFrom: null })
    const before = useDesign.getState().startFromCount

    useDesign.getState().startFromRun('a')
    useDesign.getState().clearStartFrom()

    expect(useDesign.getState().startFrom).toBeNull()
    expect(useDesign.getState().startFromCount).toBe(before + 2)
  })

  test('is dropped when the design is closed or another is started', () => {
    useDesign.setState({ design: { ...DESIGN, results: [run('a')] }, startFrom: null })
    useDesign.getState().startFromRun('a')
    useDesign.getState().closeDesign()
    expect(useDesign.getState().startFrom).toBeNull()

    useDesign.setState({ design: { ...DESIGN, results: [run('a')] } })
    useDesign.getState().startFromRun('a')
    useDesign.getState().startNewDesign(DESIGN.input, 'Another')
    expect(useDesign.getState().startFrom).toBeNull()
  })

  test('does nothing for a run that is not in the design', () => {
    useDesign.setState({ design: DESIGN, startFrom: null })
    useDesign.getState().startFromRun('missing')
    expect(useDesign.getState().startFrom).toBeNull()
  })
})

describe('setDescription', () => {
  test("sets the design's description, trimmed, and marks the design changed", () => {
    useDesign.setState({ design: DESIGN, isDirty: false })

    useDesign.getState().setDescription('  Phase II, version 3  ')

    expect(useDesign.getState().design!.description).toBe('Phase II, version 3')
    expect(useDesign.getState().isDirty).toBe(true)
  })

  test('empty text clears it, and long text is cut to the limit', () => {
    useDesign.setState({ design: { ...DESIGN, description: 'Old' } })
    useDesign.getState().setDescription('   ')
    expect(useDesign.getState().design!.description).toBeUndefined()

    useDesign.getState().setDescription('x'.repeat(5000))
    expect(useDesign.getState().design!.description).toHaveLength(MAX_DESIGN_DESCRIPTION_LENGTH)
  })
})

describe('deleteResults', () => {
  test('removes the runs, and shows the newest left if the one viewed went', () => {
    useDesign.setState({
      design: { ...DESIGN, results: [run('a'), run('b'), run('c')] },
      selectedResultId: 'c',
      isDirty: false
    })

    useDesign.getState().deleteResults(['c'])

    expect(ids()).toEqual(['a', 'b'])
    expect(useDesign.getState()).toMatchObject({ selectedResultId: 'b', isDirty: true })
  })

  test('keeps the run being viewed when it stays', () => {
    useDesign.setState({
      design: { ...DESIGN, results: [run('a'), run('b')] },
      selectedResultId: 'a'
    })

    useDesign.getState().deleteResults(['b'])

    expect(useDesign.getState().selectedResultId).toBe('a')
  })

  test('a comparison keeps its remaining runs, and ends below two', () => {
    useDesign.setState({
      design: { ...DESIGN, results: [run('a'), run('b'), run('c'), run('d')] },
      selectedResults: ['a', 'b', 'c']
    })

    useDesign.getState().deleteResults(['a'])
    expect(useDesign.getState().selectedResults).toEqual(['b', 'c'])

    useDesign.getState().deleteResults(['b'])
    expect(useDesign.getState().selectedResults).toBeNull()
  })

  test('deleting every run leaves none selected', () => {
    useDesign.setState({ design: { ...DESIGN, results: [run('a')] }, selectedResultId: 'a' })

    useDesign.getState().deleteResults(['a'])

    expect(useDesign.getState()).toMatchObject({ selectedResultId: null })
    expect(ids()).toEqual([])
  })
})
