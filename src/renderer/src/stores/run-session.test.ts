import type {
  SimulationResultEntry,
  SimulationRunResult,
  StudyDesign
} from '@shared/simulation-types'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useDesign } from './design'
import { useEngine } from './engine'
import { requestFailed, runWithEngine } from './run-session'

const RESULT: SimulationRunResult = { status: 'error', message: 'R stopped' }

function design(id: string): StudyDesign {
  return {
    version: 2,
    id,
    name: `Design ${id}`,
    createdAt: '2026-10-26T12:00:00.000Z',
    input: { N: 216, m0: 60, m: 12, R: 10, decisionRules: [] },
    results: []
  }
}

const entry: Omit<SimulationResultEntry, 'id'> = {
  createdAt: '2026-10-26T12:05:00.000Z',
  input: {
    outcomeType: 'continuous',
    meanOutcome: 10,
    sd: 2.5,
    meanDiff: 3,
    N: 216,
    m0: 60,
    m: 12,
    R: 10,
    decisionRules: [{ type: 'superiority', direction: 'greater', margin: 0, threshold: 0.95 }]
  },
  result: RESULT
}

beforeEach(() => {
  // Stands in for the preload bridge
  vi.stubGlobal('window', {
    app: { cpuCount: vi.fn(async () => 8), recordError: vi.fn() },
    design: { setDirty: vi.fn() }
  })
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  useEngine.setState({ busy: 'idle', startedAt: null })
  useDesign.setState({ design: design('a') })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('runWithEngine', () => {
  test('holds the engine while running and releases it afterwards', async () => {
    const result = await runWithEngine(
      'simulation',
      () => 'busy',
      async () => {
        expect(useEngine.getState().busy).toBe('simulation')
        return 'ran'
      }
    )

    expect(result).toBe('ran')
    expect(useEngine.getState().busy).toBe('idle')
  })

  test('releases the engine even if the run throws', async () => {
    const failing = runWithEngine(
      'batch',
      () => undefined,
      async () => {
        throw new Error('IPC failed')
      }
    )

    await expect(failing).rejects.toThrow('IPC failed')
    expect(useEngine.getState().busy).toBe('idle')
  })

  test("doesn't run when the engine is busy, and says what's using it", async () => {
    useEngine.setState({ busy: 'batch' })
    const run = vi.fn()

    const message = await runWithEngine('simulation', (busy) => busy, run)

    expect(run).not.toHaveBeenCalled()
    expect(message).toMatch(/batch is already running/)
    expect(useEngine.getState().busy).toBe('batch')
  })

  test('gives the core count, or null if it cannot be read', async () => {
    await runWithEngine(
      'simulation',
      () => undefined,
      async (session) => {
        expect(await session.cpuCount()).toBe(8)
      }
    )

    vi.mocked(window.app.cpuCount).mockRejectedValueOnce(new Error('no'))
    await runWithEngine(
      'simulation',
      () => undefined,
      async (session) => {
        expect(await session.cpuCount()).toBeNull()
      }
    )
  })

  describe('saveResult', () => {
    test('files the result, and the input if given, under the design that started the run', async () => {
      const input = { ...design('a').input, N: 300 }

      await runWithEngine(
        'simulation',
        () => undefined,
        async (session) => {
          expect(session.openCount).toBe(useDesign.getState().openCount)
          expect(session.saveResult(entry, input)).toBe(true)
        }
      )

      const saved = useDesign.getState().design
      expect(saved?.results).toHaveLength(1)
      expect(saved?.input.N).toBe(300)
    })

    test('skips a result once another design has been opened', async () => {
      await runWithEngine(
        'batch',
        () => undefined,
        async (session) => {
          useDesign.getState().startNewDesign(design('b').input, 'Design b')
          expect(session.saveResult(entry)).toBe(false)
        }
      )

      expect(useDesign.getState().design?.results).toHaveLength(0)
    })

    test('skips a result once the same design file is opened again', async () => {
      // Reopening a file (or a Save As copy) brings back the same design id
      Object.assign(window.design, {
        canLeave: vi.fn(async () => true),
        loadResult: vi.fn(async () => ({ design: design('a'), filePath: '/designs/a.design' }))
      })

      await runWithEngine(
        'simulation',
        () => undefined,
        async (session) => {
          // The run is being stopped, so confirming that isn't asked here
          useEngine.setState({ busy: 'idle' })
          expect(await useDesign.getState().loadDesign()).toBe(true)
          expect(useDesign.getState().design?.id).toBe('a')

          expect(session.saveResult(entry)).toBe(false)
        }
      )

      expect(useDesign.getState().design?.results).toHaveLength(0)
    })

    test('skips a result once the design has been closed', async () => {
      await runWithEngine(
        'batch',
        () => undefined,
        async (session) => {
          useDesign.getState().closeDesign()
          vi.mocked(window.design.setDirty).mockClear()
          expect(session.saveResult(entry)).toBe(false)
        }
      )

      // Saving into no design would mark the app as having unsaved changes
      expect(window.design.setDirty).not.toHaveBeenCalled()
    })
  })
})

describe('requestFailed', () => {
  test('logs the error under a reference and returns the message with it', () => {
    const failure = requestFailed(
      new Error('channel closed'),
      'batch request',
      'The batch stopped.'
    )

    expect(failure.message).toBe(`The batch stopped. Reference: ${failure.reference}`)
    expect(window.app.recordError).toHaveBeenCalledWith(
      failure.reference,
      'batch request',
      expect.stringContaining('channel closed')
    )
  })
})
