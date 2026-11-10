import { describe, expect, test } from 'vitest'

import { checkBatchRunInput } from './batch-input-schema'
import { MAX_BATCH_ROWS } from './design-rules'

const INPUT = {
  outcomeType: 'continuous',
  meanOutcome: 10,
  sd: 2.5,
  meanDiff: 3,
  N: 216,
  m0: 60,
  m: 12,
  R: 10,
  decisionRules: [{ type: 'superiority', margin: 0, threshold: 0.95 }]
}

const message = (data: unknown): string | null => {
  const checked = checkBatchRunInput(data)
  return checked.success ? null : checked.message
}

describe('checkBatchRunInput', () => {
  test('accepts rows that can run, keeping their row numbers', () => {
    const checked = checkBatchRunInput([
      { rowIndex: 0, input: INPUT },
      { rowIndex: 4, input: { ...INPUT, R: 20 } }
    ])
    expect(checked.success).toBe(true)
    if (checked.success) {
      expect(checked.rows.map((row) => [row.rowIndex, row.input.R])).toEqual([
        [0, 10],
        [4, 20]
      ])
    }
  })

  test('rejects anything that is not a list of rows, rather than running nothing', () => {
    expect(message({ rows: [] })).toBe("The batch's rows couldn't be read.")
    expect(message([])).toBe('The batch has no rows to run.')
  })

  test('rejects too many rows', () => {
    const rows = Array.from({ length: MAX_BATCH_ROWS + 1 }, (_, rowIndex) => ({
      rowIndex,
      input: INPUT
    }))
    expect(message(rows)).toBe(
      `A batch can have at most ${MAX_BATCH_ROWS} rows; this one has ${MAX_BATCH_ROWS + 1}.`
    )
  })

  test('names the row with a problem', () => {
    expect(
      message([
        { rowIndex: 0, input: INPUT },
        { rowIndex: -1, input: INPUT }
      ])
    ).toBe("Row 2 couldn't be read.")
    expect(message([{ rowIndex: 6, input: { ...INPUT, R: 0 } }])).toBe(
      "Row 7: These simulation settings can't be run: Number of simulated trials must be greater than 0."
    )
  })
})
