import { SimulationResultEntry } from '@shared/simulation-types'
import { createColumnHelper } from '@tanstack/react-table'
import { ChartSpline, CircleDot, ListOrdered } from 'lucide-react'

import { getTreatmentEffectLabel } from '@/components/simulation/utils'
import { DataTableColumnHeader } from '@/components/table/data-table-column-header'
import { Checkbox } from '@/components/ui/checkbox'

import { EmptyCell } from '../table/empty-cell'
import { renderCellValue } from '../table/render-cell-value'
import { type DataTableFeatures } from './data-table-features'

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, SimulationResultEntry>()

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
  columnHelper.accessor('input.treatmentEffectType', {
    id: 'treatmentEffectType',
    meta: {
      label: 'Treatment Effect'
    },
    header: 'Treatment Effect',
    cell: ({ row, getValue }) => {
      const value = getValue()
      const outcomeType = row.original.input.outcomeType
      if (outcomeType !== 'binary') {
        return <EmptyCell state="not-applicable" />
      }
      if (value == null) {
        return <EmptyCell />
      }
      return getTreatmentEffectLabel(value)
    }
  }),
  columnHelper.accessor('input.treatmentEffect', {
    id: 'treatmentEffect',
    meta: {
      label: 'Treatment Effect Value'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Treatment Effect Value" />
    },
    cell: ({ row, getValue }) => {
      const outcomeType = row.original.input.outcomeType

      if (outcomeType !== 'binary') {
        return <EmptyCell state="not-applicable" />
      }

      return renderCellValue(getValue())
    }
  }),
  columnHelper.accessor('input.meanOutcome', {
    id: 'meanOutcome',
    meta: {
      label: 'Mean Outcome'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Mean Outcome in control arm" />
    },
    cell: ({ row, getValue }) => {
      const outcomeType = row.original.input.outcomeType

      if (outcomeType !== 'continuous') {
        return <EmptyCell state="not-applicable" />
      }

      return renderCellValue(getValue())
    }
  }),
  columnHelper.accessor('input.meanDiff', {
    id: 'meanDiff',
    meta: {
      label: 'Mean Difference'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Mean Difference in treatment effect" />
    },
    cell: ({ row, getValue }) => {
      const outcomeType = row.original.input.outcomeType

      if (outcomeType !== 'continuous') {
        return <EmptyCell state="not-applicable" />
      }

      return renderCellValue(getValue())
    }
  }),
  columnHelper.accessor('input.sd', {
    id: 'sd',
    meta: {
      label: 'Standard Deviation'
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Standard Deviation" />
    },
    cell: ({ row, getValue }) => {
      const outcomeType = row.original.input.outcomeType

      if (outcomeType !== 'continuous') {
        return <EmptyCell state="not-applicable" />
      }

      return renderCellValue(getValue())
    }
  }),
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

export const outcomeTypes = [
  {
    value: 'binary',
    label: 'Binary',
    icon: CircleDot
  },
  {
    value: 'continuous',
    label: 'Continuous',
    icon: ChartSpline
  },
  {
    value: 'ordinal',
    label: 'Ordinal',
    icon: ListOrdered
  }
]
