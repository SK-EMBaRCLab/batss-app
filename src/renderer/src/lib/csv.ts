// src/renderer/src/lib/csv.ts
import type { BatchCsvRow } from '@shared/batch-types'
import Papa from 'papaparse'

export type ParsedCsv = {
  headers: string[]
  rows: BatchCsvRow[]
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
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
