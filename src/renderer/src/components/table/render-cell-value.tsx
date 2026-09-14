import type { ReactNode } from 'react'

import { EmptyCell } from './empty-cell'

export function renderCellValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <EmptyCell />
  }

  return String(value)
}
