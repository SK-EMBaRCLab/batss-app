import '@tanstack/react-table'

import type { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    label?: string
  }
}
