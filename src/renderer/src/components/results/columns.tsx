import { FIELD_LABELS, SHORT_FIELD_LABELS } from '@shared/field-labels'
import type { SimulationResultEntry } from '@shared/simulation-types'
import { createColumnHelper } from '@tanstack/react-table'

import { DataTableColumnHeader } from '@/components/table/data-table-column-header'
import { Checkbox } from '@/components/ui/checkbox'
import { fieldsFor } from '@/lib/design-fields'
import { formatDurationLabel } from '@/lib/utils'

import { EmptyCell } from '../table/empty-cell'
import { renderCellValue } from '../table/render-cell-value'
import { type DataTableFeatures } from './data-table-features'

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, SimulationResultEntry>()

const outcomeScopedColumnIds = [
  'treatmentEffectType',
  'treatmentEffect',
  'meanOutcome',
  'meanDiff',
  'sd'
] as const

type OutcomeScopedColumnId = (typeof outcomeScopedColumnIds)[number]

function outcomeScopedField(key: OutcomeScopedColumnId): {
  field: ReturnType<typeof fieldsFor>[number]
  outcomeType: 'binary' | 'continuous'
} {
  const binaryField = fieldsFor('binary').find((f) => f.key === key)
  const continuousField = fieldsFor('continuous').find((f) => f.key === key)

  return {
    field: (binaryField ?? continuousField)!,
    outcomeType: binaryField ? 'binary' : 'continuous'
  }
}

/**
 * Outcome-scoped columns whose outcome type no run in `entries` uses.
 * Every cell in them would be "N/A", so the table hides them by default.
 */
export function inapplicableColumnIds(entries: SimulationResultEntry[]): string[] {
  const outcomeTypes = new Set(entries.map((entry) => entry.input.outcomeType))
  return outcomeScopedColumnIds.filter(
    (key) => !outcomeTypes.has(outcomeScopedField(key).outcomeType)
  )
}

const outcomeScopedColumns = outcomeScopedColumnIds.map((key) => {
  const { field, outcomeType } = outcomeScopedField(key)
  const title = SHORT_FIELD_LABELS[key]

  return columnHelper.accessor(`input.${key}` as const, {
    id: key,
    meta: { label: title },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} tooltip={field.label} />
    ),
    cell: ({ row, getValue }) => {
      if (row.original.input.outcomeType !== outcomeType)
        return <EmptyCell state="not-applicable" />
      return renderCellValue(field.value(row.original.input) ?? getValue())
    }
  })
})

export const columns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5 data-indeterminate:bg-muted data-indeterminate:border-primary data-indeterminate:text-primary"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false
  }),
  columnHelper.accessor('createdAt', {
    id: 'createdAt',
    meta: {
      label: 'Created At'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Created At" />
    },
    cell: ({ getValue }) => {
      const value = getValue()
      const date = new Date(value)

      // The user's own locale, like every other date in the app
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    }
  }),
  columnHelper.accessor('result.durationMs', {
    id: 'duration',
    meta: {
      label: 'Duration'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Duration" />
    },
    cell: ({ getValue }) => {
      const durationMs = getValue()
      return durationMs == null ? (
        <EmptyCell state="not-applicable" />
      ) : (
        formatDurationLabel(durationMs / 1000)
      )
    }
  }),
  columnHelper.accessor('input.outcomeType', {
    id: 'outcomeType',
    meta: {
      label: SHORT_FIELD_LABELS.outcomeType
    },
    header: SHORT_FIELD_LABELS.outcomeType,
    filterFn: (row, columnId, filterValue: string[]) => {
      return filterValue.includes(row.getValue(columnId))
    }
  }),
  ...outcomeScopedColumns,
  columnHelper.accessor('input.N', {
    id: 'maxSampleSize',
    meta: {
      label: SHORT_FIELD_LABELS.N
    },
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={SHORT_FIELD_LABELS.N}
          tooltip={FIELD_LABELS.N}
        />
      )
    }
  }),
  columnHelper.accessor('input.m0', {
    id: 'burnIn',
    meta: {
      label: SHORT_FIELD_LABELS.m0
    },
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={SHORT_FIELD_LABELS.m0}
          tooltip={FIELD_LABELS.m0}
        />
      )
    }
  }),
  columnHelper.accessor('input.m', {
    id: 'm',
    meta: {
      label: SHORT_FIELD_LABELS.m
    },
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={SHORT_FIELD_LABELS.m}
          tooltip={FIELD_LABELS.m}
        />
      )
    }
  }),
  columnHelper.accessor('input.R', {
    id: 'numOfSimulatedTrials',
    meta: {
      label: SHORT_FIELD_LABELS.R
    },
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={SHORT_FIELD_LABELS.R}
          tooltip={FIELD_LABELS.R}
        />
      )
    }
  })
])
