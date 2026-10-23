import type { BatchCsvRow } from '@shared/batch-types'
import Papa from 'papaparse'

export type ParsedCsv = {
  headers: string[]
  rows: BatchCsvRow[]
}

// A full batch (MAX_BATCH_ROWS rows) is only tens of KB; anything this
// large is the wrong file, and parsing it whole could freeze the app
const MAX_CSV_BYTES = 1024 * 1024

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  if (file.size > MAX_CSV_BYTES) {
    return Promise.reject(new Error('This file is too large for a batch CSV (over 1 MB).'))
  }

  return new Promise((resolve, reject) => {
    Papa.parse<BatchCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message))
          return
        }
        resolve({ headers: result.meta.fields ?? [], rows: result.data })
      },
      error: (error) => reject(error)
    })
  })
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
