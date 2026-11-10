// Checks a batch sent to the main process before any row runs, so one bad
// row (or a payload that isn't a batch at all) is reported up front
// instead of stopping the batch partway through. Each row's settings get
// the same check as a single run.
import * as v from 'valibot'

import type { BatchPreparedInput } from './batch-types'
import { MAX_BATCH_ROWS } from './design-rules'
import { checkSimulationRunInput } from './simulation-input-schema'

// rowIndex is only shown to the user, but must be a real row number
const rowSchema = v.object({
  rowIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  input: v.unknown()
})

export type BatchRunInputCheck =
  { success: true; rows: BatchPreparedInput[] } | { success: false; message: string }

export function checkBatchRunInput(data: unknown): BatchRunInputCheck {
  if (!Array.isArray(data)) {
    return { success: false, message: "The batch's rows couldn't be read." }
  }
  if (data.length === 0) {
    return { success: false, message: 'The batch has no rows to run.' }
  }
  if (data.length > MAX_BATCH_ROWS) {
    return {
      success: false,
      message: `A batch can have at most ${MAX_BATCH_ROWS} rows; this one has ${data.length}.`
    }
  }

  const rows: BatchPreparedInput[] = []
  for (const [index, row] of data.entries()) {
    const shape = v.safeParse(rowSchema, row)
    if (!shape.success) {
      return { success: false, message: `Row ${index + 1} couldn't be read.` }
    }

    const { rowIndex, input } = shape.output
    const checked = checkSimulationRunInput(input)
    if (!checked.success) {
      return { success: false, message: `Row ${rowIndex + 1}: ${checked.message}` }
    }
    rows.push({ rowIndex, input: checked.input })
  }
  return { success: true, rows }
}
