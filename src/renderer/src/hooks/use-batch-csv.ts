import type { BatchPreparedInput, BatchRowValidation } from '@shared/batch-types'
import { MAX_BATCH_ROWS } from '@shared/design-rules'
import { type ChangeEvent, useMemo, useState } from 'react'

import { buildBatchValidations } from '@/lib/batch-mapper'
import { parseCsvFile } from '@/lib/csv'

type InvalidRow = Extract<BatchRowValidation, { status: 'invalid' }>

export type BatchCsv = {
  fileName: string | null
  // Why the file as a whole couldn't be used, if it couldn't
  parseError: string | null
  validations: BatchRowValidation[]
  invalidRows: InvalidRow[]
  // The rows that can run, as the batch expects them
  validInputs: BatchPreparedInput[]
  handleFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

/** A chosen batch CSV, read and checked row by row before anything runs. */
export function useBatchCsv(): BatchCsv {
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [validations, setValidations] = useState<BatchRowValidation[]>([])

  const invalidRows = useMemo(
    () => validations.filter((v): v is InvalidRow => v.status === 'invalid'),
    [validations]
  )

  const validInputs = useMemo(
    () =>
      validations.flatMap((v) =>
        v.status === 'valid' ? [{ rowIndex: v.rowIndex, input: v.input }] : []
      ),
    [validations]
  )

  const fail = (message: string): void => {
    setParseError(message)
    setValidations([])
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    setParseError(null)
    setFileName(file.name)

    try {
      const parsed = await parseCsvFile(file)

      if (parsed.rows.length === 0) return fail('The CSV has no data rows.')

      // Same limit the main process enforces, reported before Run
      if (parsed.rows.length > MAX_BATCH_ROWS) {
        return fail(
          `A batch can have at most ${MAX_BATCH_ROWS} rows; this file has ${parsed.rows.length}.`
        )
      }

      setValidations(buildBatchValidations(parsed.rows))
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Failed to parse CSV')
    } finally {
      // Reset so re-selecting the exact same file still fires onChange.
      input.value = ''
    }
  }

  return { fileName, parseError, validations, invalidRows, validInputs, handleFile }
}
