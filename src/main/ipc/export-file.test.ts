import { describe, expect, test } from 'vitest'

import { checkExportRequest, MAX_EXPORT_BYTES } from './export-file'

const BYTES = new Uint8Array([1, 2, 3])

describe('checkExportRequest', () => {
  test('accepts a chart image or a CSV, keeping the name', () => {
    expect(checkExportRequest('test – chart – 2026-11-10.png', BYTES)).toEqual({
      fileName: 'test – chart – 2026-11-10.png',
      extension: 'png',
      bytes: BYTES
    })
    expect(checkExportRequest('batch-template.csv', BYTES)?.extension).toBe('csv')
    expect(checkExportRequest('My trial – R script – 2026-11-10.R', BYTES)?.extension).toBe('r')
    expect(checkExportRequest('My trial – report – 2026-11-10.docx', BYTES)?.extension).toBe('docx')
  })

  test('keeps only the name, never a folder', () => {
    expect(checkExportRequest('../../.bashrc.csv', BYTES)?.fileName).toBe('.bashrc.csv')
    expect(checkExportRequest('C:\\Users\\me\\chart.png', BYTES)?.fileName).toBe('chart.png')
    expect(checkExportRequest('/etc/report.csv', BYTES)?.fileName).toBe('report.csv')
  })

  test('cleans characters a file name cannot hold', () => {
    expect(checkExportRequest('a:b*"c".png', BYTES)?.fileName).toBe('a b c .png')
  })

  test('refuses other file types, empty names and bad contents', () => {
    expect(checkExportRequest('chart.exe', BYTES)).toBeNull()
    expect(checkExportRequest('.png', BYTES)).toBeNull()
    expect(checkExportRequest(42, BYTES)).toBeNull()
    expect(checkExportRequest('chart.png', 'not bytes')).toBeNull()
    expect(checkExportRequest('chart.png', new Uint8Array())).toBeNull()
    expect(checkExportRequest('chart.png', new Uint8Array(MAX_EXPORT_BYTES + 1))).toBeNull()
  })
})
