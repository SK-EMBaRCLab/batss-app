import { SimulationResultEntry } from '@shared/simulation-types'
import { createColumnHelper } from '@tanstack/react-table'

import { DataTableColumnHeader } from '@/components/table/data-table-column-header'
import { Checkbox } from '@/components/ui/checkbox'
import { fieldsFor } from '@/lib/design-fields'

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

const outcomeScopedColumns = outcomeScopedColumnIds.map((key) => {
  const binaryField = fieldsFor('binary').find((f) => f.key === key)
  const continuousField = fieldsFor('continuous').find((f) => f.key === key)
  const field = binaryField ?? continuousField!

  return columnHelper.accessor(`input.${key}` as const, {
    id: key,
    meta: { label: field.label },
    header: ({ column }) => <DataTableColumnHeader column={column} title={field.label} />,
    cell: ({ row, getValue }) => {
      const matches = row.original.input.outcomeType === (binaryField ? 'binary' : 'continuous')
      if (!matches) return <EmptyCell state="not-applicable" />
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

      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    }
  }),
  columnHelper.accessor('input.outcomeType', {
    id: 'outcomeType',
    meta: {
      label: 'Outcome Type'
    },
    header: 'Outcome Type',
    filterFn: (row, columnId, filterValue: string[]) => {
      return filterValue.includes(row.getValue(columnId))
    }
  }),
  ...outcomeScopedColumns,
  columnHelper.accessor('input.N', {
    id: 'maxSampleSize',
    meta: {
      label: 'Max Sample Size'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Maximum Sample Size" />
    }
  }),
  columnHelper.accessor('input.m0', {
    id: 'burnIn',
    meta: {
      label: 'Burn-in'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Burn-in" />
    }
  }),
  columnHelper.accessor('input.m', {
    id: 'm',
    meta: {
      label: 'Patients Between'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Patients Between" />
    }
  }),
  columnHelper.accessor('input.R', {
    id: 'numOfSimulatedTrials',
    meta: {
      label: 'Number of simulated Trials'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Number of simulated Trials" />
    }
  })
])
